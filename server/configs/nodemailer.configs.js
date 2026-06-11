import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
transporter.verify().then(()=>{
  console.log('nodemailer: transporter verified')
}).catch(err=>{
  console.log('nodemailer: transporter verify failed', err && err.message)
})

const sendEmail = async ({to,subject,body}) => {
    try{
        const response = await transporter.sendMail({
            from:process.env.SMTP_SENDER_EMAIL,
            to,
            subject,
            html:body 
        })
        console.log('nodemailer: sendMail response', {
            messageId: response.messageId,
            accepted: response.accepted,
            rejected: response.rejected,
            envelope: response.envelope
        })
        return response
    } catch (err) {
        console.log('nodemailer: sendMail error', err && err.message)
        throw err
    }
}

export default sendEmail