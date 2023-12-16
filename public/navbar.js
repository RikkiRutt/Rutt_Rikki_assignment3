//code from sal

/* 
    The purpose of this file is to store code relating to the nav bar and other code that should be loaded first (before the rest of the elements are defined)

    Along with the retrieval of the products_key, the file also includes code for retrieval of the user's cookie, the opening and closing of the cart, and params. 

    The code in this file is used across all pages (except invoice)
*/

let params = (new URL(document.location)).searchParams;

/// DIRECT USER TO APPROPRIATE PRODUCT PAGE ///
// Reference from Professor Port's A3 example code
let products_key = "Replacement Parts";
if (params.has('products_key')) {
    products_key = params.get('products_key');
}
else {
    products_key;
}

/// LOAD SHOPPING CART ///
// Referenced from Professor Port's A3 example code
let shopping_cart;

// Initialize the total number of items in the cart
let totalItemsInCart = 0;

// Load the cart data from a JSON endpoint
loadJSON('/get_cart', function (response) {
    // Parse the JSON response into a shopping cart object
    shopping_cart = JSON.parse(response);

    // Iterate through each product in the shopping cart
    for (let productKey in shopping_cart) {
        // Calculate the total quantity for the current product and add it to the total
        
        // retrieves the value associated with the current product key, which is an array of quantities.
        let productQuantities = shopping_cart[productKey];

        /* In this line of code: We declare a new variable named roductTotalQuantity. We use the reduce method on the productQuantities array to calculate the total quantity of the current product. The reduce method is a higher-order function that iterates through each element of the array (currentQuantity in this case) and accumulates a result (accumulator in this case) based on a provided function. Here, the provided function (accumulator, currentQuantity) => accumulator + currentQuantity adds the current quantity to the accumulator in each iteration. As a result, productTotalQuantity will store the total quantity of the current product by summing up all the quantities in the productQuantities array. */
        let productTotalQuantity = productQuantities.reduce((accumulator, currentQuantity) => accumulator + currentQuantity);
        
        totalItemsInCart += productTotalQuantity;
    }
});

/// ACTIVE USERS ///
let users = 0;
loadJSON('/get_users', function (response) {
    users = response;
})
// Switched from window.onload because of issues with loading resources taking too long and not triggering the window.onload event
document.addEventListener('DOMContentLoaded', function () {
    // If the user's cookie exists
    if (getCookie('user_cookie') != false) {
        // Turn the string of key value pairs into an object to be parsed
        let user_cookie = getCookie('user_cookie');
        //alert(user_cookie);

        if (document.getElementById('nav_container')) {
            // Make the "login" button into a button with the user's name leading to the cart page
            document.querySelector('#nav_container').innerHTML += `
                <a class="nav-link mx-3 highlight" href="/logout.html">
                    <span class="fa-solid fa-user highlight" style="color: #0C090A"></span> ${user_cookie['name']}
                </a>
            `;
        }

        //Personalization on the index
        if (document.getElementById('user_name')) {
             document.getElementById('user_name').innerHTML = user_cookie['name'];
        }
    } else {
        document.querySelector('#nav_container').innerHTML += `
            <a class="nav-link mx-3 highlight" href="/login.html">
                <span class="fa-solid fa-user highlight" style="color: #0C090A"></span>Log in
            </a>
        `;
    }
});

/// GET USER'S COOKIE ///
// Code referenced from: https://www.w3schools.com/js/js_cookies.asp
// Decode the cookie string to only get the key value pairs from the cookie object
function getCookie(cname) {
    // Prepare the cookie name to search for
    let name = cname + "=";

    // Get and decode the entire cookie string
    let decodedCookie = decodeURIComponent(document.cookie);

    // Split the cookie string into an array of individual cookie entries
    let cookieEntries = decodedCookie.split(';');

    // Iterate through each cookie entry
    for (let i = 0; i < cookieEntries.length; i++) {
        let cookieEntry = cookieEntries[i];

        // Remove leading spaces, if any
        while (cookieEntry.charAt(0) == ' ') {
            cookieEntry = cookieEntry.substring(1);
        }

        // Check if the current cookie entry starts with the desired name
        if (cookieEntry.indexOf(name) == 0) {
            // Extract and parse the value part of the cookie
            let cookieValueString = cookieEntry.substring(name.length, cookieEntry.length);
            return JSON.parse(cookieValueString);
        }
    }

    // Return an empty string if the cookie with the specified name is not found
    return "";
}

function updateCartTotal() {
    // Assuming shopping_cart is an array of items, each with a 'quantity' property
    let newTotal = 0;

    // Loop through each item in the shopping_cart and sum up the quantities
    for (let item of shopping_cart) {
        newTotal += item.quantity;
    }

    // Update the totalItemsInCart variable with the new total
    totalItemsInCart = newTotal;

    // Update the display element in the navbar
    document.getElementById('cart_total').innerHTML = totalItemsInCart;
}

