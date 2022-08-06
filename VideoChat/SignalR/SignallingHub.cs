using Microsoft.AspNetCore.SignalR;

namespace VideoChat.SignalR
{
    public class SignallingHub : Hub
    {
        public async void SendSignal(string type, dynamic data)
        {
            await Clients.Others.SendAsync("ReceiveSignal", new {type = type, data = data});
        }
    }
}
