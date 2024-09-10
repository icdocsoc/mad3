<script lang="ts" setup>
const data = ref({
  notificationTitle: 'Parents signup is now open!',
  notificationDescription:
    'Once you have signed up, we will inform you via email when you have been allocated a family!'
});
</script>

<template>
  <div>
    <Card>
      <CardTitle>
        Welcome to DoCSoc's
        <br />
        Mums and Dads Portal!
      </CardTitle>

      <CardText class="mt-4">
        If you're unfamiliar with the Mums and Dads Scheme, every year DoCSoc
        members can become the "adoptive parents" of a up to 6 freshers and form
        a family. It is not only a great way to welcome freshers and help them
        settle into university life, but for everyone involved to make some
        friends and enjoy some events together. Each family will also get a
        termly budget that they can decide how to spend themselves.
      </CardText>

      <CardText>
        <strong>{{ data.notificationTitle }}</strong>
      </CardText>
      <CardText>
        <strong>{{ data.notificationDescription }}</strong>
      </CardText>
    </Card>

    <Card>
      <CardTitle>FAQ:</CardTitle>

      <CardDetails>
        <strong>How does it all work?</strong>
        <CardText>
          Parents are existing 2nd, 3rd, and 4th year Computing and JMC students
          in DoC. Each family will consist of two parents, and up to 6 freshers.
          After term commences, there will be a timetabled slot for freshers to
          meet their families, along with some food and activities to get to
          know each other. Each term there is also a small budget for each
          family (around 20 pounds) to use as appropriate (dinner, drinks, any
          family gathering etc).
        </CardText>
      </CardDetails>

      <CardDetails>
        <strong>Can I sign up as a solo parent?</strong>
        <CardText>
          No, unfortunately you can't. You will need to sign up with a partner -
          this is done to ensure the best possible experience for incoming
          freshers. If you sign up without choosing a partner, your registration
          will be ignored.
        </CardText>
      </CardDetails>

      <CardDetails>
        <strong>
          I've already signed up on the union website. Do I sign up here too?
        </strong>
        <CardText>
          Yes, please do. If you haven't signed up on the union website then you
          won't need to, as long as you sign up here.
        </CardText>
      </CardDetails>

      <CardDetails>
        <strong>How will freshers be allocated?</strong>
        <CardText>
          Based on the interests filled in, we do our best to assign each
          fresher to fellow freshers and parents with similar interests.
          <!-- If you're interested to find out more, the source code of this
          application is available <a href="https://github.com/icdocsoc/mad3">here</a> -->
        </CardText>
      </CardDetails>
    </Card>

    <Card class="text-center">
      <CardText>
        For any other information or queries please contact DoCSoc at
        <a href="mailto: docsoc@ic.ac.uk">docsoc@ic.ac.uk</a>
      </CardText>
      <CardText>
        For any privacy concerns you can find our privacy and GDPR policy
        <a href="/files/MaD-privacy-policy.pdf">here</a>
      </CardText>
    </Card>
  </div>
</template>

<style></style>
