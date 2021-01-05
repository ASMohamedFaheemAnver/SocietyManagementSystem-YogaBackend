import getUserData from "../middleware/auth";

const Member = require("../model/member");
const Society = require("../model/society");
const Developer = require("../model/developer");

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

  listenMemberFineOrRefinementLog: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenMemberFineOrRefinementLog" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);
      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }
      return withCancel(
        pubSub.asyncIterator(`member:log:(fine|refinement)|member(${member._id})`),
        () => {
          console.log({ emitted: "listenMemberFineOrRefinementLog.unSubscribe" });
        }
      );
    },
    resolve: (payload, args, context, info) => {
      return payload.listenMemberFineOrRefinementLog;
    },
  },

  listenMemberDonationLog: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenMemberDonationLog" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);
      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }
      return withCancel(pubSub.asyncIterator(`member:log:donation|member(${member._id})`), () => {
        console.log({ emitted: "listenMemberDonationLog.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenMemberDonationLog;
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

      return withCancel(
        pubSub.asyncIterator(`member:log:track|society(${member.society})&member(${member._id})`),
        () => {
          console.log({ emitted: "listenMemberLogTrack.unSubscribe" });
        }
      );
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

  listenNewSociety: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenNewSociety" });
      const userData = getUserData(request);
      const developer = await Developer.findById(userData.encryptedId);

      if (!developer) {
        const error = new Error("developer doesn't exist!");
        error.code = 403;
        throw error;
      }

      return withCancel(pubSub.asyncIterator(`developer:societies`), () => {
        console.log({ emitted: "listenNewSociety.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenNewSociety;
    },
  },
};

const withCancel = (asyncIterator, onCancel) => {
  const asyncReturn = asyncIterator.return;

  asyncIterator.return = () => {
    onCancel();
    return asyncReturn
      ? asyncReturn.call(asyncIterator)
      : Promise.resolve({ value: undefined, done: true });
  };

  return asyncIterator;
};

export { Subscription as default };
