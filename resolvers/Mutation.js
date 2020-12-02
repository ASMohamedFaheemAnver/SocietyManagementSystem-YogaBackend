const Society = require("../model/society");
import getUserData from "../middleware/auth";
const cloudFile = require("../util/cloud-file");
const validator = require("validator");
const bcrypt = require("bcryptjs");


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
};

export { Mutation as default };
