const validator = require("validator");
const bcrypt = require("bcryptjs");

const cloudFile = require("../util/cloud-file");
import getUserData from "../middleware/auth";
import donation from "../model/donation";

const Society = require("../model/society");
const Member = require("../model/member");
const MonthFee = require("../model/month-fee");
const ExtraFee = require("../model/extra-fee");
const Log = require("../model/log");
const Track = require("../model/track");
const Fine = require("../model/fine");
const Donation = require("../model/donation");


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
    console.log({ emitted: "createSociety" });
    const errors = [];
    if (!validator.isEmail(societyInput.email)) {
      errors.push({ message: "email is invalid!" });
    }

    if (societyInput.name.length < 3) {
      errors.push({ message: "name is invalid!" });
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

  createMember: async (parent, { memberInput }, { request, pubSub }, info) => {
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

    pubSub.publish(`society:members|society(${existingSociety._id})`, { listenNewSocietyMembers: { member: createdMember, type: "POST" } });

    return createdMember._doc;
  },

  addMonthlyFeeToEveryone: async (parent, { monthlyFee, description }, { request, pubSub }, info) => {
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

    const society = await Society.findById(userData.encryptedId).populate([{ path: "members" }, { path: "logs", match: { kind: "MonthFee" }, populate: { path: "item" } }]);

    if (!society) {
      const error = new Error("society not found to add monthly fee!");
      error.code = 404;
      throw error;
    }


    if (society.members.length < 1) {
      const error = new Error("no member exist!");
      error.code = 403;
      throw error;
    }

    // Temporary solution;
    const date = new Date();
    for (let i = 0; i < society.logs.length; i++) {
      const monthFee = society.logs[i].item;
      const month_fee_date = new Date(monthFee.date);
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
      society.members[i].arrears += monthlyFee;
      society.expected_income += monthlyFee;
      society.members[i].logs.push(log);
      await society.members[i].save();
      const track = new Track({
        member: society.members[i],
      });
      await track.save();
      monthFee.tracks.push(track);

      pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: society.members[i], type: "PUT" } });
    }

    await monthFee.save();

    society.logs.push(log);
    await society.save();

    log.fee = log.item;

    pubSub.publish(`member:log|society(${society._id})`, { listenCommonMemberLog: { log: log, type: "POST" } });
    return log;
  },

  addExtraFeeToEveryone: async (parent, { extraFee, description }, { request, pubSub }, info) => {

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

    if (!society) {
      const error = new Error("society not found to add extra fee!");
      error.code = 404;
      throw error;
    }

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
      member.logs.push(log);
      const track = new Track({
        member: member,
      });
      await track.save();
      extraFeeObj.tracks.push(track);
      await member.save();
      pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });
    }

    await extraFeeObj.save();

    society.logs.push(log);

    await society.save();

    log.fee = log.item;

    // Emitting event to all observers but If we need to filter it, we can use `member(${member._id})`
    pubSub.publish(`member:log|society(${society._id})`, { listenCommonMemberLog: { log: log, type: "POST" } });

    return log;
  },

  makeFeePaidForOneMember: async (parent, { track_id, log_id }, { request, pubSub }, info) => {
    console.log({ emitted: "makeFeePaidForOneMember" });

    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const society = await Society.findById(userData.encryptedId);

    //hack

    if (!society) {
      const error = new Error("society not found to add extra fee!");
      error.code = 404;
      throw error;
    }

    const log = await Log.findOne({ _id: log_id, is_removed: false }).populate([{ path: "item", populate: { path: "tracks", match: { _id: track_id } } }]);
    if (!log) {
      const error = new Error("activity removed!");
      error.code = 401;
      throw error;
    }

    const track = await Track.findById(track_id).populate();

    const member = await Member.findById(track.member);

    if (track.is_paid) {
      const error = new Error("this member already paid the ammount!");
      error.code = 401;
      throw error;
    }

    society.current_income += log.item.amount;
    member.arrears -= log.item.amount;
    await society.save();
    await member.save();

    if (society._id.toString() !== userData.encryptedId) {
      const error = new Error("society only can edit it's own member!");
      error.code = 401;
      throw error;
    }

    track.is_paid = true;
    await track.save();

    log.fee = log.item;
    log.fee.tracks[0] = track;
    pubSub.publish(`member:log:track|society(${society._id})&member(${member._id})`, { listenMemberLogTrack: { log: log, type: "PUT" } });
    pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });

    return { message: "member paid the ammount!" };
  },

  makeFeeUnPaidForOneMember: async (parent, { track_id, log_id }, { request, pubSub }, info) => {
    console.log({ emitted: "makeFeeUnPaidForOneMember" });

    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const society = await Society.findById(userData.encryptedId);

    if (!society) {
      const error = new Error("society not found to add extra fee!");
      error.code = 404;
      throw error;
    }

    const log = await Log.findOne({ _id: log_id, is_removed: false }).populate([{ path: "item", populate: { path: "tracks", match: { _id: track_id } } }]);

    if (!log) {
      const error = new Error("activity removed!");
      error.code = 401;
      throw error;
    }

    const track = await Track.findById(track_id).populate("member");

    const member = await Member.findById(track.member);


    if (!track.is_paid) {
      const error = new Error("this member already not paid the ammount!");
      error.code = 401;
      throw error;
    }

    society.current_income -= log.item.amount;
    member.arrears += log.item.amount;
    await society.save();
    await member.save();

    if (society._id.toString() !== userData.encryptedId) {
      const error = new Error("society only can edit it's own member!");
      error.code = 401;
      throw error;
    }

    track.is_paid = false;
    await track.save();

    log.fee = log.item;
    log.fee.tracks[0] = track;
    pubSub.publish(`member:log:track|society(${society._id})&member(${member._id})`, { listenMemberLogTrack: { log: log, type: "PUT" } });
    pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });

    return { message: "member paid the ammount!" };
  },

  approveMember: async (parent, { memberId }, { request }, info) => {
    console.log({ emitted: "approveMember" });

    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can approve it's member!");
      error.code = 401;
      throw error;
    }

    if (!memberId) {
      const error = new Error("invalid society id!");
      error.code = 403;
      throw error;
    }
    await Member.updateOne(
      { _id: memberId, society: userData.encryptedId },
      { $set: { approved: true } }
    );
    return { message: "approved successfly!" };
  },

  disApproveMember: async (parent, { memberId }, { request }, info) => {
    console.log({ emitted: "disApproveMember" });

    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can disapprove it's member!");
      error.code = 401;
      throw error;
    }

    if (!memberId) {
      const error = new Error("invalid society id!");
      error.code = 403;
      throw error;
    }
    await Member.updateOne(
      { _id: memberId, society: userData.encryptedId },
      { $set: { approved: false } }
    );
    return { message: "disapproved successfly!" };
  },

  editFeeForEveryone: async (parent, { log_id, fee, description }, { request, pubSub }, info) => {
    console.log({ emitted: "editFeeForEveryone" });
    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const log = await Log.findOne({ _id: log_id, is_removed: false }).populate([
      {
        path: "item",

        populate: {
          path: "tracks",
          populate: {
            path: "member",
          },
        },
      },
    ]);


    if (!log) {
      const error = new Error("activity removed!");
      error.code = 401;
      throw error;
    }

    let is_fee_mutated = false;

    const society = await Society.findById(userData.encryptedId);
    if (log.item.amount !== fee && log.kind !== "Donation") {
      for (let i = 0; i < log.item.tracks.length; i++) {
        let track = log.item.tracks[i];

        if (track.is_paid) {
          let member = track.member;
          track.is_paid = false;
          await track.save();
          member.arrears += fee;
          await member.save();
          society.expected_income += fee;
          society.expected_income -= log.item.amount;
          society.current_income -= log.item.amount;
          await society.save();
          pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });
        } else {
          let member = track.member;
          member.arrears -= log.item.amount;
          member.arrears += fee;

          await member.save();
          society.expected_income += fee;
          society.expected_income -= log.item.amount;
          await society.save();
          pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });
        }
      }
      is_fee_mutated = true;
    } if (log.item.amount !== fee && log.kind === "Donation") {
      society.donations += fee;
      society.donations -= log.item.amount;
      await society.save();

      let member = log.item.tracks[0].member;
      member.donations += fee;
      member.donations -= log.item.amount;
      await member.save();

    }

    log.item.amount = fee;
    log.item.description = description;
    await log.item.save();
    log.fee = log.item;
    if (log.kind === "MonthFee" || log.kind === "ExtraFee") {
      pubSub.publish(`member:log|society(${society._id})`, { listenCommonMemberLog: { log: log, type: "PUT", is_fee_mutated: is_fee_mutated } });
    } else if (log.kind === "Fine") {
      pubSub.publish(`member:log:fine|member(${log.item.tracks[0].member._id})`, { listenMemberFineLog: { log: log, type: "PUT", is_fee_mutated: is_fee_mutated } });
    }
    return log;
  },

  deleteFeeLog: async (parent, { log_id }, { request, pubSub }, info) => {
    console.log({ emitted: "deleteFeeLog" });
    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const society = await Society.findById(userData.encryptedId).populate([{
      path: "logs", match: { _id: log_id }, populate: { path: "item", populate: { path: "tracks", populate: { path: "member" } } }
    }]);


    if (!society.logs[0]) {
      const error = new Error("log was already deleted!");
      error.code = 401;
      throw error;
    }

    society.logs[0].item.tracks.forEach(async track => {
      if (track.is_paid && society.logs[0].kind !== "Donation") {
        society.current_income -= society.logs[0].item.amount;
      } else if (society.logs[0].kind !== "Donation") {
        track.member.arrears -= society.logs[0].item.amount;
      }

      let member;
      if (society.logs[0].kind !== "Donation") {
        society.expected_income -= society.logs[0].item.amount;
        member = await Member.findOneAndUpdate({ _id: track.member._id }, { arrears: track.member.arrears, $pull: { logs: log_id } }, { new: true });

        await Society.findByIdAndUpdate(society._id, {
          $pull: { logs: log_id }, $push: { removed_logs: log_id }, expected_income: society.expected_income, current_income: society.current_income
        });

      } else if (society.logs[0].kind === "Donation") {
        society.donations -= society.logs[0].item.amount;
        member = await Member.findOneAndUpdate({ _id: track.member._id }, { $inc: { donations: -society.logs[0].item.amount }, $pull: { logs: log_id } }, { new: true });

        await Society.findByIdAndUpdate(society._id, {
          $pull: { logs: log_id }, $push: { removed_logs: log_id }, $inc: { donations: -society.logs[0].item.amount }
        });

      }
      pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });
    });

    await Log.findByIdAndUpdate(log_id, { is_removed: true });


    if (society.logs[0].kind === "MonthFee" || society.logs[0].kind === "ExtraFee") {
      pubSub.publish(`member:log|society(${society._id})`, { listenCommonMemberLog: { log: society.logs[0], type: "DELETE" } });
    } else if (society.logs[0].kind === "Fine") {
      pubSub.publish(`member:log:fine|member(${society.logs[0].item.tracks[0].member._id})`, { listenMemberFineLog: { log: society.logs[0], type: "DELETE" } });
    }

    return { message: "log removed!" };
  },

  addFineForOneMember: async (parent, { fineInput: { fine, description, member_id } }, { pubSub, request }, info) => {
    console.log({ emitted: "addFineForOneMember" });

    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const society = await Society.findById(userData.encryptedId);
    if (!society) {
      const error = new Error("society doesn't exist!");
      error.code = 403;
      throw error;
    }

    const member = await Member.findById(member_id);

    if (member.society.toString() !== society._id.toString()) {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const track = new Track({ member: member });
    track.save();

    const fineObj = new Fine({
      amount: fine,
      description: description,
      date: new Date(),
      tracks: [track]
    });

    await fineObj.save();

    const log = new Log({ kind: "Fine", item: fineObj });
    await log.save();


    society.logs.push(log);
    society.expected_income += fine;
    await society.save();

    member.logs.push(log);
    member.arrears += fine;
    await member.save();

    log.fee = log.item;

    pubSub.publish(`member:log:fine|member(${member._id})`, { listenMemberFineLog: { log: log, type: "POST" } });
    pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });

    return { message: "fine added!" };

  },

  addDonationForOneMember: async (parent, { donationInput: { donation, description, member_id } }, { pubSub, request }, info) => {
    console.log({ emitted: "addDonationForOneMember" });

    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "society") {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const society = await Society.findById(userData.encryptedId);
    if (!society) {
      const error = new Error("society doesn't exist!");
      error.code = 403;
      throw error;
    }

    const member = await Member.findById(member_id);

    if (member.society.toString() !== society._id.toString()) {
      const error = new Error("only society can edit payments!");
      error.code = 401;
      throw error;
    }

    const track = new Track({ member: member, is_paid: true });
    track.save();

    const donationObj = new Donation({
      amount: donation,
      description: description,
      date: new Date(),
      tracks: [track]
    });

    await donationObj.save();

    const log = new Log({ kind: "Donation", item: donationObj });
    await log.save();


    society.logs.push(log);
    society.donations ? society.donations += donation : society.donations = donation;
    await society.save();

    member.logs.push(log);
    member.donations ? member.donations += donation : member.donations = donation;
    await member.save();

    log.fee = log.item;

    pubSub.publish(`member:log:donation|member(${member._id})`, { listenMemberDonationLog: { log: log, type: "POST" } });
    // pubSub.publish(`member:members|society(${society._id})`, { listenSocietyMembers: { member: member, type: "PUT" } });

    return { message: "donation added!" };

  }
};

export { Mutation as default };
