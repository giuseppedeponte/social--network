'use strict';
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'wdqg5wzbrnlip73r@ethereal.email',
        pass: '1fNQy6Sy9FwaYM4A1J'
    }
},{
    from: '"Social Network" <admin@social-network.com>', // sender address
    subject: 'Hello ✔', // Subject line
    text: 'Hello world?', // plain text body
});

module.exports.send = (mailOptions) => {
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  });
};
