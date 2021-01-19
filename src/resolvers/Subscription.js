import getUserData from "../middleware/auth";
import { withFilter } from "graphql-yoga";

const Member = require("../model/member");
const Society = require("../model/society");
const Developer = require("../model/developer");

const Subscription = {
  listenCommonMemberLog: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenCommonMemberLog.subscribe" });
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
      console.log({ emitted: "listenMemberFineOrRefinementLog.subscribe" });
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
      console.log({ emitted: "listenMemberDonationLog.subscribe" });
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
      console.log({ emitted: "listenMemberLogTrack.subscribe" });
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
    subscribe: async (parent, args, context, info) => {
      console.log({ emitted: "listenSocietyMembers.subscribe" });
      const userData = getUserData(context.request);
      const member = await Member.findById(userData.encryptedId);

      if (!member) {
        const error = new Error("member doesn't exist!");
        error.code = 403;
        throw error;
      }

      return withFilter(
        () => {
          return withCancel(
            context.pubSub.asyncIterator(`member:members|society(${member.society})`),
            () => {
              console.log({ emitted: "listenSocietyMembers.unSubscribe" });
            }
          );
        },
        (payload, args) => {
          if (
            payload.listenSocietyMembers.member._id.toString() === userData.encryptedId.toString()
          ) {
            return false;
          }

          return true;
        }
      )(parent, args, context, info);
    },
    resolve: (payload, args, context, info) => {
      return payload.listenSocietyMembers;
    },
  },

  listenSocietyMembersBySociety: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenSocietyMembersBySociety.subscribe" });
      const userData = getUserData(request);
      const society = await Society.findById(userData.encryptedId);

      if (!society) {
        const error = new Error("society doesn't exist!");
        error.code = 403;
        throw error;
      }

      return withCancel(pubSub.asyncIterator(`society:members|society(${society._id})`), () => {
        console.log({ emitted: "listenSocietyMembersBySociety.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenSocietyMembersBySociety;
    },
  },

  listenSociety: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenSociety.subscribe" });
      const userData = getUserData(request);
      const developer = await Developer.findById(userData.encryptedId);

      if (!developer) {
        const error = new Error("developer doesn't exist!");
        error.code = 403;
        throw error;
      }

      return withCancel(pubSub.asyncIterator(`developer:societies`), () => {
        console.log({ emitted: "listenSociety.unSubscribe" });
      });
    },
    resolve: (payload, args, context, info) => {
      return payload.listenSociety;
    },
  },

  listenMemberById: {
    subscribe: async (parent, { member_id }, { request, pubSub }, info) => {
      console.log({ emitted: "listenMemberById.subscribe" });
      const userData = getUserData(request);
      const society = await Society.findById(userData.encryptedId);

      if (!society) {
        const error = new Error("society doesn't exist!");
        error.code = 403;
        throw error;
      }

      return withCancel(
        pubSub.asyncIterator(`society:member|society(${society._id}):member(${member_id})`),
        () => {
          console.log({ emitted: "listenMemberById.unSubscribe" });
        }
      );
    },
    resolve: (payload, args, context, info) => {
      return payload.listenMemberById;
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
