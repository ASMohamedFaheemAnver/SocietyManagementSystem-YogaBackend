const Developer = require("../model/developer");
const Society = require("../model/society");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

import getUserData from "../middleware/auth";

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
    const societies = await Society.find();
    return societies;
  },
  loginSociety: async (parent, { email, password }, { request }, info) => {
    console.log({ email: email, password: password });

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
};

export { Query as default };
