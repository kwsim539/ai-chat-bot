import './ChatBotStart.css';
const ChatBotStart = ({onStartChat}) => {
    return (
        <div className='start-page'>
            <button className='start-page__btn' onClick={onStartChat}>Start AI Chat</button>
        </div>
    );
};

export default ChatBotStart;
