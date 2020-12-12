import getUserData from "../middleware/auth";

const Member = require("../model/member");
const Society = require("../model/society");

const Subscription = {
  listenCommonMemberLog: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenCommonMemberLog" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);
      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }
      return withCancel(pubSub.asyncIterator(`member:log|society(${member.society})`), () => {
        console.log({ emitted: "listenCommonMemberLog.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenCommonMemberLog;
    },
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
      return withCancel(pubSub.asyncIterator(`member:log:fine|member(${member._id})`), () => {
        console.log({ emitted: "listenMemberFineLog.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenMemberFineLog;
    },
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

      return withCancel(pubSub.asyncIterator(`member:log:track|society(${member.society})&member(${member._id})`), () => {
        console.log({ emitted: "listenMemberLogTrack.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenMemberLogTrack;
    },
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

      return withCancel(pubSub.asyncIterator(`member:members|society(${member.society})`), () => {
        console.log({ emitted: "listenSocietyMembers.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenSocietyMembers;
    },
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

      return withCancel(pubSub.asyncIterator(`society:members|society(${society._id})`), () => {
        console.log({ emitted: "listenNewSocietyMembers.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenNewSocietyMembers;
    },
  },
};

const withCancel = (asyncIterator, onCancel) => {
  const asyncReturn = asyncIterator.return;

  asyncIterator.return = () => {
    onCancel();
    return asyncReturn ? asyncReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
  };

  return asyncIterator;
};

export { Subscription as default };
