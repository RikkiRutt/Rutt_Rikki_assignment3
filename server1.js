//code used from chat and sal
//added from chat for dynamic update using websocket
const express = require('express');
const http = require('http');
const qs = require('querystring');
const app = express();

/* Used to keep track of diffrent users data as go from page to page
secret: a string used to sign the session id cookioe
resave: forces session to be saved back to the session store
saveUninitializedL forces a session that is "uninitialized" to be saved to the store
uninitialized session is a new and not modified session
*/

const session = require('express-session');
app.use(session({secret: "myNotSoSecretKey", resave: true, saveUninitialized: true}));

const server = http.createServer(app);

/* git cookie
require the cookie parser middleware
parses the cookie header and pops req.cookies with an objext keyed by cookie name
*/
const cookieParser = require('cookie-parser');
const {request} = require('http');
app.use(cookieParser());

// Middleware to log all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to ' + request.path);

    //make session cart at any request (able to add to cart before login)
    //sores quantities info
    if (typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }
//make session users at any request to stire number of useres online
    if (typeof request.session.users == 'undefined') {
        request.session.users = Object.keys(status).length;
    }
    next();
});

// Serve static files from the "public" directory
app.use(express.static(__dirname + '/public'));

// Load product data from a JSON file
const products = require(__dirname + "/products.json");

// Serve product data as JavaScript
app.get('/products.js', function (request, response, next) {
    response.type('.js');
    let productsStr = `let products = ${JSON.stringify(products)};`;
    response.send(productsStr);
    console.log(productsStr);
});

// Parse POST data for processing purchases
app.use(express.urlencoded({
    extended: true
}));

let status = {};

// Function to validate quantity entered by user against available quantity
function validateQuantity(quantity, availableQuantity) {
    let errors = [];

    quantity = Number(quantity);

    if (isNaN(quantity) && quantity !== '') {
        errors.push("Not a number. Please enter a non-negative quantity to order.");
    } else if (quantity < 0 && !Number.isInteger(quantity)) {
        errors.push("Negative quantity and not an Integer. Please enter a non-negative quantity to order.");
    } else if (quantity < 0) {
        errors.push("Negative quantity. Please enter a non-negative quantity to order.");
    } else if (quantity !== 0 && !Number.isInteger(quantity)) {
        errors.push("Not an Integer. Please enter a non-negative quantity to order.");
    } else if (quantity > availableQuantity) {
        errors.push(`We do not have ${quantity} available.`);
    }

    return errors;
}

// Function to check quantities against the server's current state
function checkQuantitiesOnServer(POST) {
    for (let i in products) {
        let qty = POST[`qty${i}`];
        if (Number(qty) > products[i].qty_available) {
            return false; // Return false if any quantity is no longer available on the server
        }
    }
    return true; // Return true if all quantities are valid
}

//addtions for a2
let user_data;

const fs=require('fs');
const e = require('express');
const { json } = require('body-parser');
const filename= __dirname + '/user_data.json';
if (fs.existsSync(filename)) {
    let data=fs.readFileSync(filename, 'utf-8');
    user_data = JSON.parse(data);
    console.log(user_data);
} else {
    console.log(`${filename} does not exist.`);
    user_data = {};
}

//stores inputs temp to be sent ahead
let temp_user={};

app.post('/get_cart', function (request, response) {
    response.json(request.session.cart);
})

app.post ('/process_login', function(request,response) {
    let POST = request.body;
    let entered_email = POST['email'].toLowerCase();
    let entered_password = POST['password'];

    if (entered_email.length == 0 && entered_password == 0) {
        request.query.loginErr = 'Both email adreess and password are required.'
        } else if (user_data[entered_email]) {
            if (user_data[entered_email].password ==  entered_password) {
                if (user_data[entered_email].password == entered_password) {
                    user_data[entered_email].status = true;
                    //add user to status object to keep track of loffed in useres
                    status[entered_email] = true;
                }
                //store user email and name in cookie
                let user_cookie= {"email": entered_email, "name": user_data[entered_email]['name']};

                //response with isers cookie as JSON string and expir set to 15 min
                response.cookie('user_cookie', JSON.stringify(user_cookie), {maxAge: 900 * 1000});
                console.log(user_cookie);

                /*//update the number of active useres
                request.session.users = Object.keys(status).length;
                console/log(`Current users: ${Object.keys(status).length} - ${Object.keys(status)});
                */

                //async write updated user_data and products to their respect files
                fs.writeFile(__dirname + filename, JSON.stringify(user_data), 'utf-8', (err) => {
                    if (err) throw err;
                });

                //redir to cart user select quant is storeed in the session cart
                response.redirect(`/cart.html?`);
                return;

            } else if (entered_password ==0) {
                request.query.loginErr = 'Password field can not be blank';
            } else {
                request.query.loginErr = 'Incorrect password';
            }
        } else {
            request.query.loginErr = 'Invalid Email';
        }
        request.query.email = entered_email;
        let params = new URLSearchParams (request.query);
        response.redirect(`login.html?${params.toString()}`);
});

//same function as temp_user
let registration_errors = {};

app.post('/process_register', function (request, response) {
    console.log(request.body);//check rece data
    // get inputs from reg form
    let reg_name = request.body.name;
    let reg_email = request.body.email.toLowerCase();
    let reg_password = request.body.password;
    let reg_confirm_password = request.body.confirm_password;

    //call name val func
    validateName(reg_name)
    //call email val func
    validateEmail(reg_email)
    //call pw val func
    validatePassword(reg_password)
    // matches pw and confrim pw
    validateConfirmPassword(reg_confirm_password, reg_password);

    // response from server to ck if no err
    if (Object.keys(registration_errors).length == 0) {
        // creating new object in the user_data object
        user_data[reg_email] = {
            "name": reg_name,
            "password": reg_password,
            "status": true
        };

        // async writing new user_data to proper files
        fs.writeFile(__dirname + '/user_data.json', JSON.stringify(user_data), 'utf-8', (err) => {
            if (err) {
                console.error('Error updating user data:', err);
            } else {
                console.log('User data has been updated!');

                status[reg_email]=true;

                response.redirect(`/login.html`);
            }
        });
    } else {
        // if err from vlad and store in reg_err
        delete request.body.password;
        delete request.body.confirm_password;
    
        let params = new URLSearchParams(request.body);    
        response.redirect(`/register.html?${params.toString()}&${qs.stringify(registration_errors)}`);
    }
    
});

function validateName(name) {
    // Clear previous errors
    delete registration_errors['name_type'];

    // Check for minimum and maximum length
    if (name.length < 2 || name.length > 30) {
        registration_errors['name_type'] = 'Full name must be between 2 and 30 characters.';
    }

    // Check if only letters are used
    if (!/^[A-Za-z]+$/.test(name)) {
        registration_errors['name_type'] = 'Full name should only contain letters.';
    }
    // Check if name is already in use
    if (Object.values(user_data).some(user => user.name === name)) {
        registration_errors['name_type'] = 'Name is already in use.';
    }
}

function validateEmail(email) {
    // Clear previous errors
    delete registration_errors['email_type'];

    // Check for the email format using a regular expression
    const emailRegex = /^[a-zA-Z0-9_.]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;

    if (!emailRegex.test(email)) {
        registration_errors['email_type'] = 'Invalid email format.';
    } else {
        // Extract the domain from the email
        const domain = email.split('@')[1];

        // Check for a valid domain extension 
        const validDomainExtensions = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'biz', 'info', 'name', 'pro', 'museum', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'in', 'br', 'mx', 'ru', 'za', 'app', 'blog', 'guru', 'tech', 'design', 'io', 'dev', 'online', 'store', 'xyz']; 

        if (!validDomainExtensions.includes(domain.split('.')[1])) {
            registration_errors['email_type'] = 'Invalid domain extension.';
        }
    }

    // Convert the email to lowercase for case-insensitive comparison
    const lowercaseEmail = email.toLowerCase();

    // Check if email is already in use
    if (user_data[lowercaseEmail]) {
        registration_errors['email_type'] = 'Email address is already in use.';
    }

}

function validatePassword(password) {
    // Clear previous errors
    delete registration_errors['password_type'];

    // Check for minimum and maximum length
    if (password.length < 10 || password.length > 16) {
        registration_errors['password_type'] = 'Password must be between 10 and 16 characters.';
    }

    // Check for spaces
    if (password.includes(' ')) {
        registration_errors['password_type'] = 'Password cannot contain spaces.';
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        registration_errors['password_type'] = 'Password must contain at least one uppercase letter.';
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        registration_errors['password_type'] = 'Password must contain at least one lowercase letter.';
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
        registration_errors['password_type'] = 'Password must contain at least one digit.';
    }

    // Check for at least one non-letter and non-digit character
    if (!/\W/.test(password)) {
            registration_errors['password_type'] = 'Password must contain at least one non-letter and non-digit character.';
    }
}

function validateConfirmPassword(confirm_password, password) {
    delete registration_errors['confirm_password_type'];

    

    if (confirm_password !== password) {
        registration_errors['confirm_password_type'] = 'Passwords do not match.';
        console.log(registration_errors);
    }
}

app.post('/add_to_cart', function (request, response) {
    //post the content of request route
    let POST = request.body;

    //get product_key from hidden input box
    let products_key = POST['products_key']

    //create object to store error messages
    let errorObject = {};

    for (let i in products[products_key]) {
        //retrieve users quant inputs
        let qty = POST[`qty${[i]}`];

        //If invalid quantity submit set name=value pairs in errobj as errMsg
        let errorMessages = validateQuantity(qty, products[products_key][i].qty_available);
        if (errorMessages.length > 0) {
            //store error in errobh to pass in URL
            errorObject[`qty${[i]}_error`] = errorMessages.join(',');
        }
        console.log('error messages are:' + errorMessages);
    }
    console.log("errorObjext = "+Object.keys(errorObject)+ " " +Object.keys(errorObject).length);

    //if no errors
    if (Object.keys(errorObject).length ==0) {
        //if session cart not exist
        if (!request.session.cart) {
            //create one
            request.session.cart = {};
        }

    //if session cart array for prod cat not exist
    if (typeof request.session.cart[products_key] == 'undefined') {
        //create one
        request.session.cart[products_key] = [];
    }

    //make array to store quantits useres input
    let user_qty = [];

    for (let i in products[products_key]) {
        //push users inpuit tnto array
        user_qty.push(Number(POST[`qty${i}`]));
    }

    //set user_qty in session
    request.session.cart[products_key] = user_qty;

    response.redirect(`/product_display.html?products_key=${POST['products_key']}`);
    }
    //if erroe
    else if (Object.keys(errorObject).length > 0) {
        response.redirect(`/product_display.html?${qs.stringify(POST)}&inputErr`);
    }

})

app.post('/update_shopping_cart', function (request, response) {
    let POST = request.body;

    let products_key = POST['products_key'];

    for (products_key in request.session.cart) {
        for (let i in request.session.cart[products_key]) {
            request.session.cart[products_key][i] = Number(request.body[`cartInput_${products_key}${i}`]);
        }
    }

    response.redirect('/cart.html');
})

app.post('/continue', function (request, response) {
    response.redirect(`/produtct_display.html?`);
})

app.post('/checkout', function (request, response) {
    if (typeof request.cookies['user_cookie'] == 'undefined') {
        response.redirect(`/login.html?`)
    } else {
        response.redirect('/invoice.html?valid');
    }
})

app.post('/complete_purchase', function (request, response) {
    //get users cookie and parse it
    let cookie = JSON.parse(request.cookies['user_cookie']);
    //get user email
    let email = cookie['email'];

    let subtotal = 0;
    let total = 0;

    //create start of invoice table
    let invoice_str = `
        Thank you for your order!
            <table>
                <thread>
                    <tr>
                        <th>Item</th>
                        <th>Quantity Purchased</th>
                        <th>Remaining Inventory</th>
                        <th>Price</th>
                        <th>Extended Price</th>
                    </tr>
                </thread>
                <tbody>
    `;
    let shopping_cart = request.session.cart;

    //calculate quantity sold and inventory
    for (let product_key in products) {
        for (let i in products[product_key]) {
            //if a prod cat has no qty slect skip it
            if (typeof shopping_cart[product_key] == 'undefined') continue;
            
        let qty = shopping_cart[product_key][i];
    
    products[product_key][i].qty_sold += Number(qty);
products[product_key][i].qty_available -= Number(qty) || 0;
}
    }

    //async write updates prod to product.json
    fs.writeFile(__dirname + '/products.json', JSON.stringify(products), 'uts-8', (err) => {
        if (err) {
            console.error('Error updating products data:', err);
        } else {
            console.log('Products data has been updated!');
        }
    });
    //print out invoice table in email
    for (let products_key in products) {
        for (let i in products[products_key]) {
            //if product cat has no quant then skip it
            if (typeof shopping_cart[products_key] == 'undefined') continue;

            let qty = shopping_cart[products_key][i];
            if (qty >0) {

                let extended_price = qty * products[products_key][i].price;
                subtotal += `
                <tr>
                    <td>${products[products_key][i].name}</td>
                    <td>${qty}</td>
                    <td>${products[products_key][i].qty_available - qty}</td>
                    <td>$${products[products_key][i].price.toFixed(2)}</td>
                    <td>$${extended_price}</td>
                </td>
                `;
            }
        }
    }

    //sales tax
    let tax_rate = (4.7/100);
    let tax_amt = subtotal * tax_rate;

    //shipping
    if (subtotal < 300) {
        shipping = 5;
        shipping_display = `$${shipping.toFixed(2)}`;
        total = Number(tax_amt + subtotal + shipping);
    }
    else if (subtotal >= 300 && subtotal < 500) {
        shipping = 10;
        shipping_display = `$${shipping.toFixed(2)}`;
        total = Number(tax_amt + subtotal + shipping);
    }
    else {
        shipping = 0;
        shipping_display = `Free`;
        total = Number(tax_amt + subtotal + shipping);
    }

    //add the remaining tax, subtotal, and tota information to invoice string
    invoice_str += `
    <tr style="border-top: 2px solid black;">
        <td colspan="4" style="text-align:center;>Sub-total</td>
        <td>$${subtotal.toFixed(2)}</td>
    </tr>
    <tr>
        <td colspan="4" style="text-align:center;">Tax @ ${Number(tax_rate) * 100}%</td>
        <td>$${tax_amt.toFixed(2)}</td>
    </tr>
    <tr>
        <td colspan="4" style"text-align:center;">Shipping</td>
        <td>${shipping_display}</td>
    </tr>
    <td>
        <td colspan="4" style"text-align:center;">total</td>
        <td>$${total.toFixed(2)}</td>
    </tr>
    </tbody>
    </table>
    `;

    request.session.destroy(); //clear cart
    response.send(invoice_str);
})

app.post('/process_logout', function (request, response) {
    //get users cookie and parse it
    let cookie = JSON.parse(request.cookies['user_cookie']);

    let email = cookie['email'];

    if (user_data[email] && user_data[email].status == true) {
        //remove user from status
        delete status[email];

        //change users status to false
        user_data[email].status = false;

        //clear users cookie
        response.clearCookie("user_cookie");

        //update number of active users in session
        request.session.users = Object.keys(status).length;

        //async write updates user_data and products to their files
        fs.writeFile(filename, JSON.stringify(user_data), 'utf-8', (err) => {
            if (err) {
                console.error('Error updatinguser data:',err);
            } else {
                console.log('User data has been updated!');
                console.log(user_data);
                console.log(`User with email ${email} was successfully logged out`);
                response.redirect('/index.html?');
            }
        });
    } else {
        console.log(user_data);
        console.log(status);
        console.error(`User with email ${email} not found or is already logged out.`);
        response.redirect('/index.html?');
    }
})

// Start the server; listen on port 8080 for incoming HTTP requests
server.listen(8080, () => console.log(`listening on port 8080`));


