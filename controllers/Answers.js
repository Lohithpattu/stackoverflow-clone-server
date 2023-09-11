import mongoose from "mongoose";
import Questions from "../models/Questions.js";
import users from "../models/user.js";

export const postAnswer = async (req, res) => {
  const { id: _id } = req.params;
  const { noOfAnswers, answerBody, userAnswered } = req.body;
  const userId = req.userId;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("question unavailable...");
  }
  updateNoOfQuestions(_id, noOfAnswers);
  try {
    const updatedQuestion = await Questions.findByIdAndUpdate(_id, {
      $addToSet: { answer: [{ answerBody, userAnswered, userId }] },
    });
    const user=await users.findById(userId);
    user.numberOfanswer+=1
    if (user.numberOfanswer%4==0) {
      user.points+=15;
    }
    await user.save();
    res.status(200).json(updatedQuestion);
  } catch (error) {
    res.status(400).json("error in updating");
  }
};

const updateNoOfQuestions = async (_id, noOfAnswers) => {
  try {
    await Questions.findByIdAndUpdate(_id, {
      $set: { noOfAnswers: noOfAnswers },
    });
  } catch (error) {
    console.log(error);
  }
};

export const deleteAnswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerId, noOfAnswers } = req.body;
  const userId=req.userId;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Question unavailable...");
  }
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).send("Answer unavailable...");
  }
  updateNoOfQuestions(_id, noOfAnswers);
  try {
    
    await Questions.updateOne(
      { _id },
      { $pull: { answer: { _id: answerId } } }
    );
    await users.findByIdAndUpdate(userId,{
      $inc:{numberOfanswer:-1}
    })
    res.status(200).json({ message: "Successfully deleted..." });
  } catch (error) {
    console.log(error)
    res.status(405).json(error);
  }
};
