const validator = require("validator");
const bcrypt = require("bcryptjs");

const cloudFile = require("../util/cloud-file");
import getUserData from "../middleware/auth";

const Society = require("../model/society");
const Member = require("../model/member");
const MonthFee = require("../model/month-fee");
const ExtraFee = require("../model/extra-fee");
const Log = require("../model/log");
const Track = require("../model/track");


const Mutation = {
  approveSociety: async (parent, { societyId }, { request }, info) => {
    console.log({ emitted: "approveSociety" });

    const userData = getUserData(request);
    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "developer") {
      const error = new Error("only developer can approve societies!");
      error.code = 401;
      throw error;
    }

    if (!societyId) {
      const error = new Error("invalid society id!");
      error.code = 403;
      throw error;
    }
    await Society.updateOne({ _id: societyId }, { $set: { approved: true } });
    return { message: "approved successfly!" };
  },

  disApproveSociety: async (parent, { societyId }, { request }, info) => {
    console.log({ emitted: "disApproveSociety" });

    const userData = getUserData(request);
    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "developer") {
      const error = new Error("only developer can approve societies!");
      error.code = 401;
      throw error;
    }

    if (!societyId) {
      const error = new Error("invalid society id!");
      error.code = 403;
      throw error;
    }
    await Society.updateOne({ _id: societyId }, { $set: { approved: false } });
    return { message: "disapproved successfly!" };
  },

  createSociety: async (parent, { societyInput }, { request }, info) => {
    console.log({ emitted: "societyInput" });
    const errors = [];
    if (!validator.isEmail(societyInput.email)) {
      errors.push({ message: "email is invalid!" });
    }

    if (societyInput.name.length < 3) {
      errors.push({ message: "name is invalid!" });
    }

    const urlRegex = new RegExp(`[images\|images/][^|\/]+`);

    if (!urlRegex.test(societyInput.imageUrl)) {
      errors.push({ message: "invalid image url!" });
    }

    if (societyInput.address.length < 10) {
      errors.push({ message: "invalid address!" });
    }

    const phoneRegex = new RegExp("[+]*[0-9]{3,13}");

    if (!phoneRegex.test(societyInput.phoneNumber)) {
      errors.push({ message: "invalid phone number!" });
    }

    const regRegex = new RegExp("([0-9]|[a-z]|[A-Z]){3,10}");

    if (!regRegex.test(societyInput.regNo)) {
      errors.push({ message: "invalid registration number!" });
    }

    if (errors.length > 0) {
      const error = new Error("invalid data submission!");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    let existingSociety = await Society.findOne({
      $or: [
        {
          email: societyInput.email,
        },
        {
          regNo: societyInput.regNo,
        },
        {
          name: societyInput.name,
        },
      ],
    });

    if (existingSociety) {
      const error = new Error(
        "society already associated witha a email, name, or registration number!"
      );
      error.code = 403;
      throw error;
    }

    const image = await societyInput.image;
    societyInput.imageUrl = await cloudFile.uploadImageToCloud(image);
    if (!societyInput.imageUrl) {
      const error = new Error("cannot upload your image!");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const hash = await bcrypt.hash(societyInput.password, 12);

    const society = new Society({
      email: societyInput.email,
      name: societyInput.name,
      imageUrl: societyInput.imageUrl,
      address: societyInput.address,
      password: hash,
      phoneNumber: societyInput.phoneNumber,
      regNo: societyInput.regNo,
      number_of_members: 0,
    });

    const createdSociety = await society.save();
    return createdSociety._doc;

  },

  createMember: async (parent, { memberInput }, { request }, info) => {
    console.log({ emitted: "createMember" });

    const errors = [];
    if (!validator.isEmail(memberInput.email)) {
      errors.push({ message: "email is invalid!" });
    }

    if (memberInput.name.length < 3) {
      errors.push({ message: "name is invalid!" });
    }

    if (memberInput.address.length < 10) {
      errors.push({ message: "invalid address!" });
    }

    const phoneRegex = new RegExp("[+]*[0-9]{3,13}");

    if (!phoneRegex.test(memberInput.phoneNumber)) {
      errors.push({ message: "invalid phone number!" });
    }

    if (errors.length > 0) {
      const error = new Error("invalid data submission!");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    let existingSociety = await Society.findById(memberInput.societyId);

    if (!existingSociety) {
      const error = new Error("society not exist!");
      error.code = 403;
      throw error;
    }

    let existingMember = await Member.findOne({
      email: memberInput.email,
    });

    if (existingMember) {
      const error = new Error("member already exist!");
      error.code = 403;
      throw error;
    }

    const image = await memberInput.image;
    memberInput.imageUrl = await cloudFile.uploadImageToCloud(image);

    if (!memberInput.imageUrl) {
      const error = new Error("cannot upload your image!");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const hash = await bcrypt.hash(memberInput.password, 12);
    let member = new Member({
      email: memberInput.email,
      name: memberInput.name,
      password: hash,
      imageUrl: memberInput.imageUrl,
      address: memberInput.address,
      arrears: 0,
      society: existingSociety,
      phoneNumber: memberInput.phoneNumber,
    });
    const createdMember = await member.save();
    existingSociety.members.push(createdMember);
    existingSociety.number_of_members++;
    await existingSociety.save();
    return createdMember._doc;
  },

  addMonthlyFeeToEveryone: async (parent, { monthlyFee, description }, { request }, info) => {
    console.log({ emitted: "addMonthlyFeeToEveryone" });

    const userData = getUserData(request);


    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can add fee to it's members!");
      error.code = 401;
      throw error;
    }

    if (monthlyFee < 20) {
      const error = new Error("monthly fee should be more than 20!");
      error.code = 403;
      throw error;
    }

    const society = await Society.findById(userData.encryptedId).populate("members");
    // console.log(society);
    // console.log(society.members);

    if (society.members.length < 1) {
      const error = new Error("no member exist!");
      error.code = 403;
      throw error;
    }

    // Temporary solution
    const date = new Date();
    for (let i = 0; i < society.month_fees.length; i++) {
      const monthFee = await MonthFee.findById(society.month_fees[i]);
      const month_fee_date = new Date(monthFee.date);
      console.log({ currentDate: date, monthFeeDate: month_fee_date });
      if (
        date.getFullYear() === month_fee_date.getFullYear() &&
        date.getMonth() === month_fee_date.getMonth() &&
        date.getDate() - month_fee_date.getDate() < 15
      ) {
        const error = new Error("You already have added monthly fee!");
        error.code = 403;
        throw error;
      }
    }

    const monthFee = new MonthFee({
      amount: monthlyFee,
      date: new Date(),
      description: description,
    });

    const log = new Log({ kind: "MonthFee", item: monthFee });
    await log.save();

    for (let i = 0; i < society.members.length; i++) {
      const member = await Member.findById(society.members[i]);
      member.arrears += monthlyFee;
      society.expected_income += monthlyFee;
      member.month_fees.push(monthFee);
      member.logs.push(log);
      await member.save();
      const track = new Track({
        member: member,
      });
      await track.save();
      monthFee.tracks.push(track);
    }

    await monthFee.save();
    society.month_fees.push(monthFee);

    society.logs.push(log);
    await society.save();

    // const updatedSociety = await Society.findById(req.decryptedId);
    // console.log(updatedSociety.logs);
    log.fee = log.item;
    return log;
  },

  addExtraFeeToEveryone: async (parent, { extraFee, description }, { request }, info) => {

    console.log({ emitted: "addExtraFeeToEveryone" });

    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can add fee to it's members!");
      error.code = 401;
      throw error;
    }

    const society = await Society.findById(userData.encryptedId).populate("members");
    // console.log(society);
    // console.log(society.members);

    if (society.members.length < 1) {
      const error = new Error("no member exist!");
      error.code = 403;
      throw error;
    }

    if (extraFee < 20) {
      const error = new Error("extra fee should be more than 20!");
      error.code = 403;
      throw error;
    }

    const extraFeeObj = new ExtraFee({
      amount: extraFee,
      date: new Date(),
      description: description,
    });

    const log = new Log({ kind: "ExtraFee", item: extraFeeObj });
    await log.save();

    for (let i = 0; i < society.members.length; i++) {
      const member = await Member.findById(society.members[i]);
      member.arrears += extraFee;
      society.expected_income += extraFee;
      member.extra_fees.push(extraFeeObj);
      member.logs.push(log);
      const track = new Track({
        member: member,
      });
      await track.save();
      extraFeeObj.tracks.push(track);
      await member.save();
    }

    await extraFeeObj.save();
    society.extra_fees.push(extraFeeObj);

    society.logs.push(log);

    await society.save();

    log.fee = log.item;
    return log;
  },
};

export { Mutation as default };
