import React, {useEffect, useState} from 'react';
import ChatBotStart from './Components/ChatBotStart.jsx'
import ChatBotApp from "./Components/ChatBotApp.jsx";
import {v4 as uuidv4} from 'uuid';
const App = () => {
    const [isChatting, setIsChatting] = useState(false);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);

    useEffect(() => {
        const storedChats = JSON.parse(localStorage.getItem('chats')) || []; // Pull the stored chats from local storage
        setChats(storedChats);

        if (storedChats.length > 0) { // If there is stored chats this will take the first chat history and makes it active
            setActiveChat(storedChats[0].id);
        }
    }, [])


    const handleStartChat = () => {
        setIsChatting(true);
        if (chats.length === 0) {
            createNewChat();
        }
    }
    const handleEndChat = () => {
        setIsChatting(false);
    }
    const createNewChat = (initialMessage = '') => {
        const newChat = {
            id: uuidv4(),
            displayId: `Chat ${new Date().toLocaleDateString("en-US")} ${new Date().toLocaleTimeString()}`,
            messages: initialMessage ? [{type: 'prompt', text: initialMessage, timestamp: new Date().toLocaleTimeString(),}] : [],
        }
        const updatedChats = [newChat, ...chats]
        setChats(updatedChats);
        localStorage.setItem('chats', JSON.stringify(updatedChats)); // Save the current chats in local storage
        localStorage.setItem(newChat.id, JSON.stringify(newChat.messages)); // Each message will be stored using the id as the local storage key
        setActiveChat(newChat.id);
    }
    return (
        <div className='container'>
            {isChatting ? (
                <ChatBotApp
                    onEndChat={handleEndChat}
                    chats={chats}
                    setChats={setChats}
                    activeChat={activeChat}
                    setActiveChat={setActiveChat}
                    onNewChat={createNewChat}
                />
            ) : (
                <ChatBotStart onStartChat={handleStartChat} />
            )}
        </div>
    );
};

export default App;
