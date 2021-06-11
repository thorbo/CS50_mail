document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;

  // Set reply and archive button functions. Pass email id number through dataset property.
  rep = document.querySelector('#reply')
  rep.onclick = () => {
    reply(rep.dataset.id_num)
  }

  arch = document.querySelector('#archive')
  arch.onclick = () => {
    archive(arch.dataset.id_num)
    arch.clicked = arch.clicked
  }

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_email() {
    // POST to emails API
    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: document.querySelector('#compose-recipients').value,
            subject: document.querySelector('#compose-subject').value,
            body: document.querySelector('#compose-body').value
        })
    })

    // Clear fields if submitted successfully, otherwise display error
    .then(response => {
        if (response.status == 201){
            response.json()
            .then(response => console.log(response));
            compose_email()
        } else {
            response.json()
            .then(response => {
                alert(`error: ${response.error}`)
            })
        }
    })

    // prevent default form submission
    return false
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none'

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

async function load_mailbox(mailbox) {
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none'

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // Fetch relevant emails to list variable
    let emails = await fetch(`/emails/${mailbox}`)
    .then(response => response.json())

    // Generate HTML to display
    emails.forEach(email => {
        const sender = document.createElement('p')
        sender.innerHTML = `From: ${email.sender}`
        const subject = document.createElement('p')
        subject.innerHTML = `Subject: ${email.subject}`
        const timestamp = document.createElement('p')
        timestamp.innerHTML = `Date/Time: ${email.timestamp}`

        const div = document.createElement('div')
        div.dataset.number = email.id
        div.onclick = () => {
            email_view(email.id)
        }
        div.append(sender)
        div.append(subject)
        div.append(timestamp)
        if (email.read) {
        div.style.background = '#bababa'
        }
        document.querySelector('#emails-view').append(div)
    })
}

async function email_view(id_num) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'none'
    document.querySelector('#compose-view').style.display = 'none'
    document.querySelector('#email-view').style.display = 'block'
    document.querySelector('#archive').dataset.id_num = id_num
    document.querySelector('#reply').dataset.id_num = id_num

    // Query emails API for info
    email = await fetch(`/emails/${id_num}`)
        .then(response => response.json())

    document.querySelector('#view-sender').value = email.sender
    document.querySelector('#view-recipients').value = email.recipients
    document.querySelector('#view-subject').value = email.subject
    document.querySelector('#view-body').value = email.body
    document.querySelector('#view-time').value = email.timestamp
    document.querySelector('#archive').checked = email.archived

    fetch(`/emails/${id_num}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
}

function archive(id_num) {

    // Get checkbox element
    let checkbox = document.querySelector('#archive')

    // Switch archived state and checkbox state
    fetch(`/emails/${id_num}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: checkbox.checked
      })
    })

    return false
}

async function reply(id_num) {
    email = await fetch(`/emails/${id_num}`)
        .then(response => response.json())
    console.log(email)

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none'

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email.sender;

  if (email.subject.length > 3 && email.subject.slice(0,3) == "Re:") {
    document.querySelector('#compose-subject').value = email.subject
  } else {
    document.querySelector('#compose-subject').value = "Re: " + email.subject
  }

  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: \n\n${email.body}`
}