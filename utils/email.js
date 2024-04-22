const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Youssef Hikal <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        // service: 'Brevo',
        host: process.env.SENDINBLUE_HOST,
        // port: process.env.SENDINBLUE_PORT,
        port: 587,
        auth: {
          user: process.env.SENDINBLUE_LOGIN,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      // port: process.env.EMAIL_PORT,
      port: 2525,

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //1)render HTML based on pug email
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );
    // 2) define email options
    const mailOptions = {
      from: this.from,
      // from: process.env.SENDGRID_EMAIL_FROM,
      to: this.to,
      subject: subject,
      html: html,
      text: htmlToText.fromString(html),
    };

    // 3) create a transport and send an email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("Welcome", " Welcome to natours family");
  }
      
  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      `your password reset token is valid for 10 mins `,
    );
  }
};

// const sendEmail = async (options) => {
//   // 2) define email options

//   //3) send the email
//   await transoprter.sendMail(mailOptions);
// };
