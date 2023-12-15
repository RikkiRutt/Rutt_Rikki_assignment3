////code used from sal, chat, and bing chat gpt
//product card
for (let i in products[products_key]) {
    // Create a product card for each product
    let productCard = document.createElement('div');
    productCard.className = 'col-md-4 product_card';
    productCard.style = 'margin-bottom: 40px; padding: 30px;';

    productCard.innerHTML = `
        <div>
            <h5 class="product_name"><b>${products[products_key][i].model}</b></h5>
            <h5>$${(products[products_key][i].price).toFixed(2)}</h5>
        </div>  
        <img src="${products[products_key][i].image}" style="width: 300px; height: 250px;" class="img-thumbnail" alt="${products[products_key][i].alt}">
        <div style="height: 90px;">
            <table style="width: 100%; text-align: center; font-size: 18px;" id="product_table">
                <tr>
                    <!-- Display available quantity for the product -->
                    <td style="text-align: left; width: 35%;">Available: ${products[products_key][i].qty_available}</td>

                    <!-- Label for quantity -->
                    <td style="text-align: left; width: 75%;"><label id="qty${[i]}_label" style="margin: 6px 0; padding-right: 10px;">Qty:</label></td>
                </tr>
                <tr>
                    <!-- Display sold quantity for the product -->
                    <td style="text-align: left; width: 35%;" id="qty_sold${i}">Sold: ${products[products_key][i].qty_sold}</td>

                    <!-- Input field for quantity and buttons to increase/decrease -->
                    <td style="text-align: left; width: 35%;" rowspan="2">
                        <div style="display: flex; justify-content: center; align-items: center; border-radius: 40px; border: 2px solid black; width: 60%; height: 40px; padding: 10px;">
                            <!-- Decrease quantity button with an onclick event -->
                            <button type="button" class="qtyButton highlight" style="background-color: transparent; border: none; cursor: pointer; padding: 5px 10px; font-size: 40px; margin-bottom: 11px;" onclick="changeQuantity(${i}, -1)">-</button>

                            <!-- Input field for quantity -->
                            <input type="text" autocomplete="off" placeholder="0" name="qty${[i]}" id="qty${[i]}_entered" class="inputBox" style="background-color: transparent; border: none; width: 30px; text-align: center; margin: 0 10px; border: none;" oninput="validateAndDisplayMessage(this, ${products[products_key][i].qty_available})">

                            <!-- Increase quantity button with an onclick event -->
                            <button type="button" class="qtyButton highlight" style="background-color: transparent; border: none; cursor: pointer; padding: 5px 10px; font-size: 30px; margin-bottom: 7px;" onclick="changeQuantity(${i}, 1)">+</button>
                        </div>
                    </td>
                    <td colspan="3" style="padding-top: 10px;">
                    <input type="submit" value="Add to cart" class="sm-button highlight">
                </td>
                </tr>
                <tr>
                    <!-- Error message for quantity validation -->
                    <td colspan="3" style="padding-top: 60px;"><div id="qty${[i]}_error" style="color: red;"></div></td>
                </tr>
            </table>
        </div>  
    `;

}


window.onload = function() {
    // Get the URL
    //let params = (new URL(document.location)).searchParams;
    /* If there is a server side validation error
    Display message to user and allow them to edit their inputs
    User input is made sticky by retrieving quantities from the URL 
    Those inputs are validated again */


    if (params.has('error')) {
        document.getElementById('errMsg').innerHTML = "No quantities selected.";
        setTimeout(() => {
            document.getElementById('errMsg').innerHTML = "";
        }, 4000);
    } 
    else if (params.has('inputErr')) {
        alert("input error");
        document.getElementById('errMsg').innerHTML = "Please fix errors before proceeding."
        setTimeout(() => {
            document.getElementById('errMsg').innerHTML = "";
        }, 4000);

        for (let i in products[products_key]) {
            if (params.get(`qty${i}`) == 0) {
                qty_form[`qty${i}`].value = '';
            } else {
                qty_form[`qty${i}`].value = params.get(`qty${i}`);
                qty_form[`qty${i}`].parentElement.style.borderColor = "red";
            }
            errors = validateQuantity(params.get(`qty${i}`), products[products_key][i].qty_available);
            document.getElementById(`qty${i}_error`).innerHTML = errors.join('');  
            alert(errors);
        }
    }

    // Make input boxes sticky (for valid quantities) after returning from the cart
    if ((typeof shopping_cart[products_key] != 'undefined') && (params.has('inputErr') != true)) {
        for (let i in shopping_cart[products_key]) {
            if (shopping_cart[products_key][i] == 0) {
                document.getElementById(`qty${[i]}`).value = '';
            } 
            else {
                document.getElementById(`qty${[i]}`).value = shopping_cart[products_key][i];
            }
        }
    }
}


// Function to handle quantity changes
function changeQuantity(index, delta) {
    let inputField = document.getElementById(`qty${index}_entered`);
    let currentValue = parseInt(inputField.value, 10) || 0;
    let newValue = currentValue + delta;

    // Update the input field value
    inputField.value = newValue;

    // Trigger input event for immediate validation
    inputField.dispatchEvent(new Event('input'));
}

// Do client-side validation
function validateQuantity(quantity, availableQuantity) {
    let errors = []; // Initialize an array to hold error messages

    quantity = Number(quantity);

    if ((isNaN(quantity)) && (quantity != '')) {
        errors.push("Not a number. Please enter a non-negative quantity to order.");
    } else if (quantity < 0 && !Number.isInteger(quantity)) {
        errors.push("Negative quantity and not an Integer. Please enter a non-negative quantity to order.");
    } else if (quantity < 0) {
        errors.push("Negative quantity. Please enter a non-negative quantity to order.");
    } else if (quantity !=0 && quantity != '' && !Number.isInteger(quantity)) {
        errors.push("Not an Integer. Please enter a non-negative quantity to order.");
    } else if (quantity > availableQuantity) {
        errors.push(`We do not have ${quantity} available.`);
    }

    return errors; // Return the array of errors
}

// CHECK INPUT BOXES AGAINST DATA VALIDATION FUNCTION
function validateAndDisplayMessage(textBox, availableQuantity) {
    let str = String(textBox.value);

    // Check if the first character is '0' and remove it if found
    if (str.charAt(0) == '0') {
        textBox.value = Number(str.slice(0, 0) + str.slice(1, str.length));
    }

    // Convert the input value to a number
    let inputValue = Number(textBox.value);

    // Validate the user input quantity using the updated validateQuantity function
    let errorMessages = validateQuantity(inputValue, availableQuantity);

    // Check if there are any error messages and update the display
    let errorDisplay = document.getElementById(textBox.name + '_error');

    if (errorMessages.length > 0) {
        // If there are error messages, change the color to red
        errorDisplay.style.color = 'red';
        textBox.parentElement.style.borderColor = 'red';
        errorDisplay.innerHTML = errorMessages.join('<br>');

        // Store the invalid quantity in local storage
        localStorage.setItem(`invalidQty_${textBox.name}`, textBox.value);
    } else {
        // If no error messages, change the color to blue
        errorDisplay.style.color = 'blue';
        textBox.parentElement.style.borderColor = 'blue';
        errorDisplay.innerHTML = `You have selected ${inputValue}.`;

        // Remove the stored invalid quantity from local storage
        localStorage.removeItem(`invalidQty_${textBox.name}`);
    }
}

// STICKY NAV BAR: Referenced from https://www.w3schools.com/howto/howto_js_navbar_sticky.asp
window.onscroll = function() {
    stickyNav()
};

// Get the navbar using its id
let navbar = document.getElementById("sticky-navbar");

// offsetTop returns the top position relative to the parent (documentation: https://www.w3schools.com/jsref/prop_element_offsettop.asp)
// The parent of navbar is body
let sticky = navbar.offsetTop;

function stickyNav() {
    // pageYOffSet returns the pixels a document has scrolled from the upper left corner of the window
    if (window.pageYOffset >= sticky) {
        navbar.classList.add("sticky")
    } else {
        navbar.classList.remove("sticky");
    }
};




