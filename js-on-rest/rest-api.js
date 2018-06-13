export default (request, response) => {

    const db = require('kvstore');
    const xhr = require('xhr');
    const vault = require('vault');

    response.headers['Access-Control-Allow-Origin'] = '*';
    response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE';

    // Choose route based on request.params and request.method
    // Execute the controller function in the controllers object
    const route = request.params.route;
    const method = request.method.toLowerCase();

    const body = JSON.parse(request.body);

    // Functions for defined 'Routes'.
    // Add functions for each object under HTTP method keys
    let controllers = {
        default: {}, 
        index: {},
        account: {},
        counter: {},
        kitty: {}
    };

    // Response helpers
    const ok = () => {
        response.status = 200;
        return response.send();
    };

    const unauthorized = () => {
        response.status = 401;
        return response.send();
    };

    const badRequest = () => {
        response.status = 400;
        return response.send();
    };

    const notFound = () => {
        response.status = 404;
        return response.send();
    };

    const serverError = (code, errorToClient) => {
        response.status = code;
        return response.send(errorToClient);
    };

    // default GET request returns 200 OK
    controllers.default.get = () => {
        response.status = 200;
        return response.send();
    };

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Example: HTML
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    controllers.index.get = () => {
        response.status = 200;
        response.headers['Content-Type'] = 'text/html; charset=utf-8';
        return response.send('<html>Hello!!</html>');
    };
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// END - Example: HTML
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Example: CRUD REST API
// TODO: Add request validation logic for all routes.
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
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

            // Set value with TTL of 7 days, 32KB per entry.
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
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// END - Example: CRUD REST API
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Example: State Counter
// TODO: Request validation.
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Get the value of a counter by `id`
    // increment counter if a param of `increment` is equal to true
    controllers.counter.get = () => {
        const id = request.params.id;

        if (request.params.increment) {
            return db.incrCounter(id).then((counter) => {
                response.status = 200;
                return response.send(counter);
            }).catch((error) => {
                console.error(error);
                return badRequest();
            });
        } else {
            return db.getCounter(id).then((counter) => {
                response.status = 200;
                return response.send(counter);
            }).catch((error) => {
                console.error(error);
                return badRequest();
            });
        }
    };
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// END - Example: State Counter
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Example: Query an external API
// You can use secret API credentials with the vault module
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    controllers.kitty.get = () => {
        const url = 'http://thecatapi.com/api/images/get?results_per_page=1';

        // Store a top secret key by clicking the 'MY SECRETS'
        // button on the left. Get it mid-execution with `vault.get`.

        // return vault.get('secret_api_key').then((apiKey) => {
            return xhr.fetch(url, {
                'method': 'GET',
                'headers': {
        //             'Authorization': apiKey
                }
        //    });
        }).then((result) => {
            response.status = 302;
            response.headers['Location'] = result.url;
            return response.send();
        });
    }
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// END - Example: Query an external API
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


    // GET request with empty route returns 200
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
};