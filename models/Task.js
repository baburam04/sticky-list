const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  color: { type: String, default: "#FFFFFF" },
  pinned: { type: Boolean, default: false } // Default is unpinned
});

module.exports = mongoose.model("Task", TaskSchema);
