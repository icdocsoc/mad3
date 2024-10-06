import smtplib


class Mailer:

    def __init__(self, send_emails=False):

        self.__send_emails = send_emails

        smtp = smtplib.SMTP("smtp.office365.com", 993)

        smtp.starttls()
        smtp.login("SHORTCODE@ic.ac.uk", "PASSWORD")

        self.__smtp = smtp

    def send_mail(self):

        self.__smtp.sendmail(
            "SHORTCODE@ic.ac.uk",
            "SENDER@ic.ac.uk",
            "Hello Adelina, this is a test message"
        )


mailer = Mailer()

print(mailer.__dict__)
