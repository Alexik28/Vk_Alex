let accessToken = localStorage.getItem('accessToken');
let userId=localStorage.getItem('userId'); 

if(!accessToken|| !userId)
{
  console.log('Пользователь не авторизован.');
}
else
{
  console.log('Пользователь авторизовался', accessToken);
  console.log('User ID:',userId);
  loadUserInfo(accessToken, userId);
}


function handleResponse(response) {
  if (response.error) {
    document.getElementById('user-info').innerHTML = `<p style="color: red;"> Ошибка:${response.error.error_msg} </p>`;
  }
  else {
    const userInfo = response.response[0];
    const userInfoHTML = `<img src="${userInfo.photo_200}" alt="Фото пользователя">
     <h2>${userInfo.first_name} ${userInfo.last_name}</h2>
     <p>Username: @${userInfo.domain}</p>`;

    document.getElementById('user-info').innerHTML = userInfoHTML;
  }


}

function handleFriendsResponse(response) {
  const friendsList = document.getElementById('friends-list');
  if (response.error) {
    friendsList.innerHTML = `<p style = "color: red;"> Ошибка: ${response.error.error_msg}</p>`;
  }
  else {
    const friends = response.response.items;
    const friendsHTML = friends.map(friend => `
      <div class = "friend-card" data-responser-id="${friend.id}">
      <img src="${friend.photo_100}">
      <h3>${friend.first_name} ${friend.last_name}</h3>
      </div>
      `).join('');
    friendsList.innerHTML = friendsHTML;
  }

  //добавляем обработчики на карточки
  document.querySelectorAll('.friend-card').forEach(card => {
    card.addEventListener('click', () => openChat(card.dataset.responserId));
  });


}


function openChat(responserId) {
  currentId = responserId;
  const chatWindow = document.getElementById('chat-window');
  chatWindow.style.display = 'block';
  loadMessageHistory(responserId);
}

function loadMessageHistory(responserId) {
  const script = document.createElement('script');
  script.src = `https://api.vk.com/method/messages.getHistory?peer_id=${responserId}&access_token=${accessToken}&v=5.131&count=20&callback=handleHistoryResponse`;
  document.body.appendChild(script);
}


function handleHistoryResponse(response) {
  const chatHistory = document.getElementById('chat-history');
  if (response.error) {
    chatHistory.innerHTML = `<p style="color: red;">Ошибка: ${response.error.error_msg}</p>`;
  } else {
    const messages = response.response.items;
    const historyHTML = messages.map(msg => {
      let attachmentsHTML = '';
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(attachment => {
          
          if (attachment.type === 'video') {
            attachmentsHTML += `
              <div>
                <iframe width="320" height="240" src="${attachment.video.player}" frameborder="0" allowfullscreen></iframe>
                <p>${attachment.video.title}</p>
                <p><strong>${msg.out ? 'Вы' : 'Пользователь'}</strong></p
              </div>
            `;
          }
          else if (attachment.type === 'photo') {
            attachmentsHTML += `
              <div>
                <img src="${attachment.photo.sizes.find(size => size.type === 'x').url}" alt="Фото">
                <p><strong>${msg.out ? 'Вы' : 'Пользователь'}</strong></p
              </div>
            `;
          }
          else if (attachment.type === 'audio_message') {
            attachmentsHTML += `
              <div>
                <audio controls>
                  <source src="${attachment.audio_message.link_ogg}" type="audio/ogg">
                  Ваш браузер не поддерживает аудио элемент.
                </audio>
                <p>Голосовое сообщение</p>
                <p><strong>${msg.out ? 'Вы' : 'Пользователь'}</strong></p
              </div>
            `;

          }
          else if (attachment.type === 'sticker') {
            const stickerUrl = attachment.sticker.images[attachment.sticker.images.length - 1].url;
            attachmentsHTML += `
              <div>
                <img src="${stickerUrl}" alt="Стикер" style="max-width:200px;">
                <p><strong>${msg.out ? 'Вы' : 'Пользователь'}</strong></p
              </div>
            `;

          }
          else if(attachment.type==='link')
          {
            attachmentsHTML+=`
             <div>
              <a href="${attachment.link.url}" target="_blank">${attachment.link.title||attachment.link.url}</a>
              <p><strong>${msg.out ? 'Вы' : 'Пользователь'}</strong></p
             </div>
             
            `;
          }
          else if (attachment.type === 'doc') {
            attachmentsHTML += `
              <div>
                <a href="${attachment.doc.url}" target="_blank">${attachment.doc.title}</a>
                <p><strong>Отправлено: ${msg.out ? 'Вы' : 'Пользователь'}</strong></p>
              </div>
            `;
          }
        });
      }

      const messageText = msg.text ? `<p><strong>${msg.out ? 'Вы' : 'Пользователь'}</strong> ${msg.text}</p>` : '';

      return `<div>
        ${messageText}
        ${attachmentsHTML}
      </div>`;
    }).join('');

    chatHistory.innerHTML = historyHTML;
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

function sendTextMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value.trim();
  if (message && currentId) {
    const script = document.createElement('script');
    script.src = `https://api.vk.com/method/messages.send?peer_id=${currentId}&message=${encodeURIComponent(message)}&access_token=${accessToken}&v=5.131&random_id=${Math.floor(Math.random() * 1000000)}&callback=handleSendResponse`;
    document.body.appendChild(script);
  }
}

function handleSendResponse(response) {
  if (response.error) {
    console.error('Ошибка:', response.error.error_msg);
  }
  else {
    console.log('Сообщение отправлено', response.response);
    document.getElementById('message-input').value='';
    document.getElementById('file-input').value='';
    loadMessageHistory(currentId);
  }
}





document.getElementById('auth-button').addEventListener('click',function()
{
  const authUrl = 'https://oauth.vk.com/authorize?client_id=6287487&scope=1073737727&redirect_uri=https://aesthetic-biscochitos-1d8967.netlify.app/blank.html&display=page&response_type=token&revoke=1';
  const authWindow = window.open(authUrl,'VK Auth', 'width=500,height=600');
  window.addEventListener('message', function(event){
    
    const accessToken=event.data.access_token;
    const userId=event.data.user_id;

    if(accessToken&&userId)
    {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userId',userId);

      authWindow.close();
      console.log('Access Token', accessToken);
      console.log('User ID:',userId);

      loadUserInfo(accessToken,userId);
      loadFriends(accessToken, userId);
    }
  });
});

function sendMessageWithAttachment(peerId, attachmentString) {
  const script = document.createElement('script');
  script.src = `https://api.vk.com/method/messages.send?peer_id=${peerId}&attachment=${attachmentString}&access_token=${accessToken}&v=5.131&random_id=${Math.floor(Math.random() * 1000000)}&callback=handleSendResponse`;
  document.body.appendChild(script);
}

function loadUserInfo(accessToken, userId) {
  const script = document.createElement('script');
  script.src = `https://api.vk.com/method/users.get?user_ids=${userId}&access_token=${accessToken}&v=5.131&fields=photo_200,domain&callback=handleResponse`;
  document.body.appendChild(script);
}

function loadFriends(accessToken, userId) {
  const script = document.createElement('script');
  script.src = `https://api.vk.com/method/friends.get?user_id=${userId}&access_token=${accessToken}&v=5.131&fields=photo_100,first_name,last_name&callback=handleFriendsResponse`;
  document.body.appendChild(script);
}