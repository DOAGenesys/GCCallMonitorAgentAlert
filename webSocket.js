async function initializeWebSocket() {
    const currentSection = getSection();
    console.log("currentSection.id in initializeWebSocket : " + currentSection.id);

    let channelId;
    const platformClient = getPlatformClient();
    const apiInstance = new platformClient.NotificationsApi();

    console.log("About to call postNotificationsChannels...");

    apiInstance.postNotificationsChannels({})
        .then(response => {
            console.log("Received response from postNotificationsChannels:", response);

            channelId = response.id;
            const ws = new WebSocket(response.connectUri);

            ws.onmessage = (event) => {
                console.log("WebSocket message received:", event.data);
                const data = JSON.parse(event.data);
                
                if (data.topicName === `v2.detail.events.conversation.${window.conversationId}.user.start`) {
                    getConversation(data.eventBody.conversationId);
                }
                
                if (data.eventBody.disconnectType) {
                    console.log("Received disconnectType in WebSocket message. Closing WebSocket.");
                    ws.close();
                }
            };

            ws.onopen = () => {
                console.log("WebSocket connection opened.");
                subscribeToTopic(channelId, `v2.detail.events.conversation.${window.conversationId}.user.start`);
            };

            ws.onerror = (error) => {
                console.log("WebSocket encountered an error:", error);
            };

            ws.onclose = (event) => {
                console.log("WebSocket connection closed:", event);
            };
        })
        .catch(err => {
            console.error("Error during postNotificationsChannels call:", err);
        });
}

function subscribeToTopic(channelId, topicName) {
    console.log("Attempting to subscribe to topic:", topicName);

    const platformClient = getPlatformClient();
    let apiInstance = new platformClient.NotificationsApi();
    
    apiInstance.postNotificationsChannelSubscriptions(channelId, [topicName])
        .then(() => {
            console.log("Successfully subscribed to topic:", topicName);
        })
        .catch(err => {
            console.error("Error during topic subscription:", err);
        });
}

function getConversation(conversationId) {
    console.log(`Fetching conversation details for ID: ${conversationId}`);

    const platformClient = getPlatformClient();

    const client = platformClient.ApiClient.instance;

    let apiInstance = new platformClient.ConversationsApi();

    // Get conversation
    apiInstance.getConversation(conversationId)
      .then((data) => {
        console.log(`getConversation success! data: ${JSON.stringify(data, null, 2)}`);
        const participant = data.participants.find(p => p.id === data.participantId);
        if (participant) {
            const aniName = participant.aniName;
            const mediaRole = participant.mediaRoles.length > 0 ? participant.mediaRoles[0] : 'No media role';
            const monitoredParticipantId = participant.monitoredParticipantId || 'No monitored participant';
            console.log(`Participant Info - ANI Name: ${aniName}, Media Role: ${mediaRole}, Monitored Participant ID: ${monitoredParticipantId}`);
        }
      })
      .catch((err) => {
        console.log("There was a failure calling getConversation");
        console.error(err);
      });
}

