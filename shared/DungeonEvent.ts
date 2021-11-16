export class DungeonEvent {
    // socket.io events
    public static readonly Connection = "connection";
    public static readonly Disconnect = "disconnect";
    public static readonly Connect = "connect";

    // auth events
    public static readonly Register = "Register";
    public static readonly Registered = "Registered";
    public static readonly EmailAlreadyTaken = "EmailAlreadyTaken";
    public static readonly Login = "Login";
    public static readonly LoginFailed = "LoginFailed";
    public static readonly LoginSuccessful = "LoginSuccessful";
    
    // game events
    public static readonly Hello = "Hello";
    public static readonly Move = "Move";
    public static readonly UpdatePosition = "UpdatePosition";
    public static readonly PlayerLeft = "PlayerLeft";
    
}
