using VideoChat.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();
builder.Services.AddCors();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseCors(x => x.AllowAnyHeader().AllowCredentials().AllowAnyMethod().WithOrigins("http://localhost:4200"));

app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<SignallingHub>("signal");
});

app.Run();
