import { CSEChat } from './CSEChat';
import Config from './Config';
import EventEmitter from './EventEmitter';
declare class ChatClient {
    chat: CSEChat;
    connected: boolean;
    updated: number;
    errorListener: any;
    config: Config;
    emitter: EventEmitter;
    private _connect(rooms);
    private _online(rooms);
    private _onerror(err);
    private _initializeEvents();
    private _disconnect();
    private _fire(topic, data?);
    on(topic: string, handler: (data?: any) => void): any;
    off(id: any): void;
    connectWithToken(loginToken: string, nick?: string, rooms?: string[]): void;
    connect(username: string | (() => string), password: string | (() => string), nick?: string, rooms?: string[]): void;
    disconnect(): void;
    reconnect(rooms: string[]): void;
    getNick(): string;
    getStoredRooms(): string[];
    removeFromStoredRooms(room: string): void;
    addToStoredRooms(room: string): void;
    setStoredRooms(rooms: string[]): void;
    sendMessageToRoom(message: string, roomName: string): void;
    sendMessageToUser(message: string, userName: string): void;
    joinRoom(roomName: string): void;
    leaveRoom(roomName: string): void;
    getRooms(): void;
}
export default ChatClient;
