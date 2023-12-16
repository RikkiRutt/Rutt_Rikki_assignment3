/* 
    The purpose of this file is to store code relating to cart information (the table that displays when the cart is opened)

    The code in this file is used across all pages (except invoice)
*/
//used sal code

document.addEventListener('DOMContentLoaded', function() {
    // Displaying the cart total
    document.getElementById('cart_total').innerHTML = totalItemsInCart;

    // Initialize variables for tax, subtotal, and total
    let subtotal = 0;
    let shipping;
    let total_price = 0;
    let tax_rate = (4.7/100);
    for (let products_key in shopping_cart) {
        for (let i in shopping_cart[products_key]) {
            let quantities = shopping_cart[products_key][i];
            if (quantities > 0) {
                extended_price = quantities * products[products_key][i].price;
                subtotal += extended_price;

                document.querySelector('#cart_info').innerHTML += `
                    <table class="cartItems">
                        <tr>
                            <td colspan="3" style="text-align: center; padding: 5px;">${products[products_key][i].model}</td>
                        </tr>
                        <tr>
                            <td rowspan="4" style="padding: 5px; width: 45%;"">
                                <td width="15%"><img src="${products[products_key][i].image}" alt="${products[products_key][i].alt}" class="img-thumbnail"></td>
                            </td>
                            <td style="width: 20%;">$${(products[products_key][i].price).toFixed(2)} x </td>
                            <td style="width: 25%;">
                                <div style="border-radius: 50px; border: 1px solid black; height: 30px; max-width: 90px;">
                                    <button type="button" id="minus${i}" class="cartButton"
                                    onclick="
                                        if (document.getElementById('cartInput_${products_key}${i}').value == 0) { return;} 
                                        document.getElementById('cartUpdate').style.display = 'inline-block'; 
                                        document.getElementById('cartSubmit').style.display = 'none';
                                        update_qty('cartInput_${products_key}${i}', -1, ${products[products_key][i].price})">
                                    --
                                    </button>

                                    <input type="number" autocomplete="off" id="cartInput_${products_key}${i}" value="${quantities}" class="cartBox" name="cartInput_${products_key}${i}" readonly onchange="inventory_amt(this)">

                                    <button type="button" class="cartButton"
                                        onclick="
                                            if (document.getElementById('cartInput_${products_key}${i}').value == ${products[products_key][i].inventory}) return
                                            document.getElementById('cartUpdate').style.display = 'inline-block'; 
                                            document.getElementById('cartSubmit').style.display = 'none'; 
                                            update_qty('cartInput_${products_key}${i}', 1, ${products[products_key][i].price});">+
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3" style="font-size: 18px;">
                                $<span id="ep_cartInput_${products_key}${i}">${extended_price.toFixed(2)}</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="3">
                                <button type="button" class="btn_link highlight" 
                                    onclick="
                                    removeItem('${products_key}', ${i}); 
                                    document.getElementById('cartUpdate').style.display = 'inline-block'; 
                                    document.getElementById('cartSubmit').style.display = 'none'">Remove</button>
                            </td>
                        </tr>
                    </table> 
                `;
            }
        }
    }

    //  Initial calculation of tx, shipping, and total
    update_totals();

    

    // Function to update totals based on the shopping cart
   

    // If nothing has been added to the cart, hide the submit buttons and display 'Empty cart'
    if (subtotal === 0) {
        document.getElementById('cart_info').innerHTML = `Empty cart.`;
        document.getElementById('cartSubmit').style.display = 'none';
        document.getElementById('cartUpdate').style.display = 'none';

        document.querySelector('#tax_info').innerHTML = '';
    }
    else {
        document.getElementById('cartUpdate').style.display = 'none';
    }
})
//document.getElementById('users').innerHTML = `Active users: ${users}`;

// Function to safeguard against users inputting numbers greater than the inventory amt
function inventory_amt(input) {
    for (let i in products[products_key]) {
        // Check if the value is greater than the quantity available
        if (input.value > products[products_key][i].qty_available) {
            input.value = products[products_key][i].qty_available;
            break;
        }
    }
}

// Function triggered when remove button is clicked
function removeItem(productKey, index) {
    // Set the quantity in the shopping cart to 0
    shopping_cart[productKey][index] = 0;

    // Update the input value to 0
    let inputElement = document.getElementById(`cartInput_${productKey}${index}`);
    if (inputElement) {
        inputElement.value = 0;
        // Call update_qty to recalculate extended price
        update_qty(`cartInput_${productKey}${index}`, 0, products[productKey][index].price);
    }

    // Update extended price and totals
    update_totals();

    updateCartTotal();
}

// Function to update quantities and recalculate totals
function update_qty(input, change, price) {
    // Use the id of the input box to get and store the element in input_element 
    let input_element = document.getElementById(input);
    // Parse the input box's value as integer, default to 0 if NaN
    let input_value = parseInt(input_element.value, 10) || 0;
    
    if (input_element) {
        // The new quantity is the og input value plus the change
        let new_qty = input_value + change;
        if (new_qty < 0) {
            new_qty = 0;
        }

        // The quantity in the input box becomes the new qty
        input_element.value = new_qty;

        // Update extended price
        let extended_price_element = document.getElementById(`ep_${input}`);
        if (extended_price_element) {
            extended_price_element.innerHTML = (new_qty * price).toFixed(2);
        }

        // Recalculate tax, subtotal, shipping, and total
        update_totals();

        updateCartTotal();
    }
}
function update_totals() {
    // Reset values
    subtotal = 0;
    total_price = 0;

    // Iterate through products and quantities in the shopping cart
    for (let products_key in shopping_cart) {
        for (let i in shopping_cart[products_key]) {
            let quantities = shopping_cart[products_key][i];
            let input_element = document.getElementById(`cartInput_${products_key}${i}`);
            
            // Get the user-input quantity or use the cart quantity if the input is not present
            let user_qty = input_element ? parseInt(input_element.value, 10) || 0 : 0;

            // Calculate subtotal, excluding items with a quantity of 0
            if (user_qty > 0) {
                subtotal += user_qty * products[products_key][i].price;
            }
        }
    }

    // Sales tax
    let tax_amt = subtotal * tax_rate;

    // Shipping
    if (subtotal < 300) {
        shipping = 5;
        shipping_display = `$${shipping.toFixed(2)}`;
    }
    else if (subtotal >= 300 && subtotal < 500) {
        shipping = 10;
        shipping_display = `$${shipping.toFixed(2)}`;
    }
    else {
        shipping = 0;
        shipping_display = 'FREE';
    }
    total_price = Number(tax_amt + subtotal + shipping);
    
    // Update the HTML content to display the calculated values
    document.querySelector('#tax_info').innerHTML = `
        <br>
        <p style="font-size: 13px;">
            Subtotal: $${subtotal.toFixed(2)}<br>
            Tax Amount: $${tax_amt.toFixed(2)}<br>
            Shipping: ${shipping_display}
        </p>
        <p style="text-transform: uppercase;">Total: $${total_price.toFixed(2)}</p>


        <p style="font-size: 10px;">SHIPPING POLICY: 
            <br>For orders with subtotal <u>$300 or less</u>, a shipping fee of <u>$5</u> will be added.
            <br>For orders with subtotal <u>$500 or less</u>, a shipping fee of <u>$10</u> will be added.
            <br>Orders with subtotal <u>above $500</u> will receive <u>free shipping</u> .
        </p>
    `;
}