   const mongoose = require('mongoose');
   require('dotenv').config();

   const connectDB = async () => {
       try {
            mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
           });
           console.log('MongoDB connected Successfully');  
       } catch (error) {
           console.error(error.message);
           process.exit(1);
       }
   };

   module.exports = connectDB;
   