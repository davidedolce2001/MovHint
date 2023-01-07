import { API_URL } from "./config.js"

let movie_item_template = ""
let userDetails = {}

fetch(`${API_URL}/userDetails`, {
    method: "GET",
    credentials: "include"
}).then(response => {
    console.log(response.status)
    if (!response.ok) {
        document.getElementById("login-navbar").textContent = "Log in"
        document.getElementById("login-navbar").setAttribute('href', 'login.html')
        window.location.href = 'index.html'
    } else {
        document.getElementById("login-navbar").textContent = "Logout"
        document.getElementById("login-navbar").setAttribute('href', 'logout.html')
        response.json().then((json) => {
            userDetails = json
            fetch("html/movie_item.ejs")
                .then(r => r.text())
                .then((text) => {
                    movie_item_template = text
                    document.getElementById('movies-list-detailed').innerHTML = ''
                    for (const elem of userDetails.recommendations) {
                        console.log(elem)
                        document.getElementById('movies-list-detailed').innerHTML += ejs.render(movie_item_template, {movie: elem});
                    }

                })
        })
    }
})




