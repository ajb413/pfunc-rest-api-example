# Build a REST API in 5 minutes with PubNub

**Step by step guide** [hosted here](https://www.pubnub.com/blog/build-a-rest-api-in-5-minutes-with-pubnub/?devrel_gh=adamb) on the PubNub blog. [PubNub](https://dashboard.pubnub.com/signup?devrel_gh=pfunc-rest-api-example) is forever free to try.

PubNub Functions are JavaScript event handlers that can be executed on in-transit PubNub messages, or in the request/response style of a RESTful API over HTTPS.

Deploying code can be done on the command line using the `pubnub-cli` on npm and also **via CI/CD** like [in this tutorial](https://www.pubnub.com/blog/ci-cd-deploy-pubnub-functions-cli/?devrel_gh=pfunc-rest-api-example).

For deploying using your command line, see [this tool](https://www.pubnub.com/docs/blocks/cli-api?devrel_gh=pfunc-rest-api-example).

PubNub Functions are serverless, there is **no need to worry about deploying, maintaining, or scaling server infrastructure**. We have several points of presence around the world in which your code is **deployed simultaneously**. This ensures that your users have an **extremely low latency** experience, **regardless of their location**.

## REST API

You can build a REST API with Functions and deploy it with 1 button click. **Create a forever free account [at PubNub](https://dashboard.pubnub.com/signup?devrel_gh=pfunc-rest-api-example)** and click the Functions tab in the dashboard. Create a module and an event handler with the type `on request`.

Press the play button on the right and use the UI on the left for making test **GET, POST, PUT,** and **DELETE** requests.

![PubNub Functions Test HTTP Request Button](https://i.imgur.com/XjrCSBD.png)

The **COPY URL** button on the left gives you the public URL that this API is hosted. The ending path can be adjusted but the URL itself is static and immutable.

![PubNub Functions On Request Handler](https://i.imgur.com/do62Eii.png)

## Examples
The event handler in this repo shows how to turn this event handler into an API. There is a `controllers` object that points to a JavaScript function for each `route` URL parameter based on the HTTP method used (like GET, POST, PUT, and DELETE).

```javascript
let controllers = {
    default: {}, 
    index: {},
    account: {},
    counter: {},
    kitty: {}
};
```

The code at the very bottom selects the function to execute based on the **request method** and **URL parameters**. If there is not a route defined on the back end, a **404** is returned.

```javascript
const route = request.params.route;
const method = request.method.toLowerCase();

if (!route && method === 'get') {
    return controllers.default.get();
} else if (
    method &&
    route &&
    controllers[route] &&
    controllers[route][method]
) {
    return controllers[route][method]();
} else {
    return notFound();
}
```

## CRUD methods for a REST API
```javascript
// Read an account object from the DB by its `id`.
controllers.account.get = () => {
    // TODO: Check that user is authorized and validate `params`.
    const id = request.params.id;
    return db.get(`account-${id}`).then((accountData) => {
        response.status = 200;
        return response.send({
            account_data: accountData
        });
    });
};

// Creates an account object from the POST request body
controllers.account.post = () => {
    // TODO: Check that user is authorized and validate `body`.
    const id = body.id;
    const accountData = body.account_data;

    // Set value with TTL of 7 days, 32KB max per entry.
    return db.set(`account-${id}`, accountData, 10080)
    .then(() => {
        // Helper function defined earlier
        return ok();
    }).catch((error) => {
        console.error(error);
        return badRequest();
    });
};

// Update the user name attribute of the account object
controllers.account.put = () => {
    // TODO: Check that user is authorized and validate `body`.
    const id = body.id;
    const userName = body.user_name;

    // Get the existing account information for a user
    return db.get(`account-${id}`)
    .then((accountData) => {
        accountData = accountData || {};

        // Update the user name attribute of the account object
        accountData.user_name = userName;

        // Set value with TTL of 7 days, 32KB max per entry.
        return db.set(`account-${id}`, accountData, 10080);
    }).then(() => {
        // Helper function defined earlier
        return ok();
    }).catch((error) => {
        console.error(error);
        return badRequest();
    });
};

// Destroy an account object specified by `id`
controllers.account.delete = () => {
    // TODO: Check that user is authorized and validate `params`.
    const id = request.params.id;

    // Delete value by setting it to null.
    return db.set(`account-${id}`, null)
    .then(() => {
        // Helper function defined earlier
        return ok();
    }).catch((error) => {
        console.error(error);
        return badRequest();
    });
};
```

## Return HTML
```javascript
controllers.index.get = () => {
    response.status = 200;
    response.headers['Content-Type'] = 'text/html; charset=utf-8';
    return response.send('<html>Hello!!</html>');
};
```

## Proxy one or many external API requests

Up to 3 `xhr` requests can be made in 1 event handler execution. They can be chained using JavaScript promises.

```javascript
controllers.kitty.get = () => {
    const url = 'http://thecatapi.com/api/images/get?results_per_page=1';
    return xhr.fetch(url).then((result) => {
        response.status = 302;
        response.headers['Location'] = result.url;
        return response.send();
    });
}
```

Also an API request that needs secret API keys can be properly implemented in Functions using [vault](https://www.pubnub.com/docs/blocks/vault-module?devrel_gh=pfunc-rest-api-example). Add secret keys to the module by clicking **MY SECRETS** in the event handler editor page.

```javascript
const xhr = require('xhr');
const vault = require('vault');

return vault.get("myApiKey").then((apiKey) => {
    const http_options = {
        "method": "GET",
        "headers": {
            "API_KEY": apiKey
        }
    };
    return xhr.fetch("https://httpbin.org/get", http_options).then((resp) => {
        console.log(resp);
        return response.send("OK");
    });
});
```
