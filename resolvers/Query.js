const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

import getUserData from "../middleware/auth";

const Developer = require("../model/developer");
const Society = require("../model/society");
const Log = require("../model/log");
const MonthFee = require("../model/month-fee");
const ExtraFee = require("../model/extra-fee");
const Track = require("../model/track");
const Member = require("../model/member");


const Query = {
  loginDeveloper: async (parent, { email, password }, ctx, info) => {
    console.log({ emitted: "loginDeveloper" });

    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push({ message: "email is invalid!" });
    }

    if (password.length < 8) {
      errors.push({
        message: "password should be more than or equal to 8 charactors!",
      });
    }

    if (errors.length > 0) {
      const error = new Error("invalid credentials!");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    let developer = await Developer.findOne({ email: email });
    if (!developer) {
      const error = new Error("developer doesn't exist!");
      error.code = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, developer.password);

    if (!isEqual) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      { encryptedId: developer._id.toString(), category: "developer" },
      process.env.secret_word,
      { expiresIn: "10h" }
    );

    return {
      token: token,
      _id: developer._id.toString(),
      expiresIn: 36000,
    };
  },

  getAllSocieties: async (parent, args, { request }, info) => {
    console.log({ emitted: "getAllSocieties" });

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
    const societies = await Society.find();
    return societies;
  },

  getBasicSocietyDetailes: async () => {
    console.log({ emitted: "getBasicSocietyDetailes" });

    const societies = await Society.find();
    return societies;
  },
  loginSociety: async (parent, { email, password }, { request }, info) => {
    console.log({ emitted: "loginSociety" });

    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push({ message: "email is invalid!" });
    }

    if (password.length < 8) {
      errors.push({
        message: "password should be more than or equal to 8 charactors!",
      });
    }

    if (errors.length > 0) {
      const error = new Error("invalid credentials!");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    let society = await Society.findOne({ email: email });
    if (!society) {
      const error = new Error("society doesn't exist!");
      error.code = 401;
      throw error;
    }

    if (!society.approved) {
      const error = new Error("society doesn't approved yet!");
      error.code = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, society.password);

    if (!isEqual) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      { encryptedId: society._id.toString(), category: "society" },
      process.env.secret_word,
      { expiresIn: "10h" }
    );

    return { token: token, _id: society._id.toString(), expiresIn: 36000 };
  },

  getSociety: async (parent, args, { request }, info) => {
    console.log({ emitted: "getSociety" });
    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }
    if (userData.category !== "society") {
      const error = new Error("only developer can delete societies!");
      error.code = 401;
      throw error;
    }
    const society = await Society.findById(userData.encryptedId);
    return society;
  },

  getSocietyLogs: async (parent, { page_number, page_size }, { request }, info) => {
    console.log({ emitted: "getSocietyLogs" });
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

    let logs_count = await Society.findById(userData.encryptedId);
    logs_count = logs_count.logs.length;
    const society = await Society.findById(userData.encryptedId).populate([
      {
        path: "logs",
        options: {
          skip: page_number * page_size,
          limit: page_size,
          sort: {
            _id: -1,
          },
        },
        populate: {
          path: "item",
          populate: {
            path: "tracks",
            populate: {
              path: "member",
            },
          },
        },
      },
    ]);

    // console.log(society);

    society.logs.map((log) => {
      if (log.kind === "MonthFee" || log.kind === "ExtraFee") {
        log.fee = log.item;
      }

      return log;
    });

    // console.log(society.logs);

    return { logs: society.logs, logs_count: logs_count };
  },

  getAllMembers: async (parent, args, { request }, info) => {

    console.log({ emitted: "getAllMembers" });
    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }
    if (userData.category !== "society") {
      const error = new Error("only society can view it's members!");
      error.code = 401;
      throw error;
    }
    const society = await Society.findById(userData.encryptedId).populate("members");
    return society.members;
  },

  loginMember: async (parent, { email, password }, { request }, info) => {
    console.log({ emitted: "loginMember" });

    const errors = [];

    if (!validator.isEmail(email)) {
      errors.push({ message: "email is invalid!" });
    }

    if (password.length < 8) {
      errors.push({
        message: "password should be more than or equal to 8 charactors!",
      });
    }

    if (errors.length > 0) {
      const error = new Error("invalid credentials!");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    console.log({ email: email, password: password });
    let member = await Member.findOne({ email: email });

    if (!member) {
      const error = new Error("member doesn't exist!");
      error.code = 401;
      throw error;
    }
    // console.log(member.approved);
    if (!member.approved) {
      const error = new Error("member doesn't approved yet!");
      error.code = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, member.password);

    if (!isEqual) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      { encryptedId: member._id.toString(), category: "member" },
      process.env.secret_word,
      { expiresIn: "10h" }
    );
    return { token: token, _id: member._id.toString(), expiresIn: 36000 };
  },

  getMember: async (parent, args, { request }, info) => {

    console.log({ emitted: "getMember" });
    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "member") {
      const error = new Error("only developer can approve societies!");
      error.code = 401;
      throw error;
    }

    const member = await Member.findById(userData.encryptedId);
    return member._doc;
  },

  getMemberLogs: async (parent, { page_number, page_size }, { request }, info) => {
    console.log({ emitted: "getMemberLogs" });
    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }

    if (userData.category !== "member") {
      const error = new Error("only member can see his logs!");
      error.code = 401;
      throw error;
    }

    const member = await Member.findById(userData.encryptedId).populate([
      {
        path: "logs",
        options: {
          skip: page_number * page_size,
          limit: page_size,
          sort: {
            _id: -1,
          },
        },
        populate: {
          path: "item",
        },
      },
    ]);

    let logs_count = member.logs.length;

    // console.log(society);

    member.logs.map((log) => {
      if (log.kind === "MonthFee" || log.kind === "ExtraFee") {
        log.fee = log.item;
      }

      return log;
    });


    return { logs: member.logs, logs_count: logs_count };
  },

  getAllSocietyMembers: async (parent, args, { request }, info) => {
    console.log({ emitted: "getAllSocietyMembers" });
    const userData = getUserData(request);

    if (!userData) {
      const error = new Error("not authenticated!");
      error.code = 401;
      throw error;
    }
    if (userData.category !== "member") {
      const error = new Error("you are not a member!");
      error.code = 401;
      throw error;
    }

    const member = await Member.findById(userData.encryptedId).populate([{ path: "society", populate: { path: "members", match: { _id: { $ne: userData.encryptedId } } } }]);
    return member.society.members;
  },


};

export { Query as default };
