import getUserData from "../middleware/auth";

const Member = require("../model/member");
const Society = require("../model/society");

const Subscription = {
  listenCommonMemberLog: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenMemberLog" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);
      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }
      return pubSub.asyncIterator(`member:log|society(${member.society})`);
    }
  },

  listenMemberFineLog: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenMemberFineLog" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);
      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }
      return pubSub.asyncIterator(`member:log:fine|member(${member._id})`);
    }
  },

  listenMemberLogTrack: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenMemberLogTrack" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);

      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }

      return pubSub.asyncIterator(`member:log:track|society(${member.society})&member(${member._id})`);
    }
  },

  listenSocietyMembers: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenSocietyMembers" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);

      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }

      return pubSub.asyncIterator(`member:members|society(${member.society})`);
    }
  },

  listenNewSocietyMembers: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenNewSocietyMembers" });
      const userData = getUserData(request);
      const society = await Society.findById(userData.encryptedId);

      if (!society) {
        const error = new Error("society doesn't exist!");
        error.code = 403;
        throw error;
      }

      return pubSub.asyncIterator(`society:members|society(${society._id})`);
    }
  },
};

export { Subscription as default };
