
To compile and load a template:

```java
eb = vertx.eventBus();
eb.send("dust.compile",new JsonObject().putString("name", "test").putString("source", "hello {x}"));
```
	
	
To render the template with data:

```java
eb.send("dust.render",
	new JsonObject().putString("name","test")
	                .putObject("context",
	                     new JsonObject().putString("x","world!")
	                ),
	new Handler<Message<JsonObject>>() {
		@Override
		public void handle(Message<JsonObject> renderReply) {
			String output = renderReply.body().getString("output", null);
			if (output != null)
				System.out.println("here is your rendered output:\n"+output);
			else
				System.err.println(renderReply.body().getString("error"));
		}
	});
	
```
