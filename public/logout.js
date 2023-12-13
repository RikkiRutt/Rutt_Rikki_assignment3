//if no cookie detected, send to login page
if (getCookie('user_cookie') != false) {
    user_cookie = getCookie('user_cookie');

    document.getElementById('verify').innerHTML = `
    <h1>Hi ${user_cookie['name']}!</h1>
    <p>Are you sure you want to logout?</p>
    `;

    //add event listener for logout buttonn
    document.getElementById('logout_button').addEventListener('click', function() {
        //clear cookie
        document.cookie = 'user_cookie=; expires=Mon, 01 Jan 1990 00:00:00 UTC; path=/;';

        //redir to login
        location.href = './login.html';
    });

} else {
    location.href= '/.login.html';
    window.stop;
}