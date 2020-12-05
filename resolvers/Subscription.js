import getUserData from "../middleware/auth";

const Member = require("../model/member");

const Subscription = {
  listenMemberLog: {
    subscribe: async (parent, args, { request, pubSub }, info) => {
      console.log({ emitted: "listenMemberLog" });
      const userData = getUserData(request);
      const member = await Member.findById(userData.encryptedId);
      return pubSub.asyncIterator(`member:log:society(${member.society})`);
    }
  }
};

export { Subscription as default };
