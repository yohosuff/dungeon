export class DungeonEvent {
    // socket.io events
    public static readonly Connection = "connection";
    public static readonly Disconnect = "disconnect";
    public static readonly Connect = "connect";

    // game events
    public static readonly Hello = "Hello";
    public static readonly Move = "Move";
    public static readonly UpdatePosition = "UpdatePosition";
    public static readonly PlayerLeft = "PlayerLeft";
}
