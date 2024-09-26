import { ACCESS_TOKEN, BASE_AUTH_URL, END_POINTS, EXPIRES_IN, REFRESH_TOKEN, TOKEN_TYPE } from "../common";
import "../index.css";
const CLIENT_ID = '5b582e7024f6499b98544a29f7f58176';  
import spotifyLogo from "/Primary_Logo_White_CMYK.svg";
const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');

const redirectUrl = 'http://localhost:3000/login/index.html';

const getToken = async (code) => {
    let codeVerifier = localStorage.getItem('code_verifier');
  
    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUrl,   
            code_verifier: codeVerifier,
        }),
    };

    const response = await fetch(`${BASE_AUTH_URL}/${END_POINTS.TOKEN}`, payload);
    return response.json();
};

const saveTokenToLocalStorage = (token) => {
    const { access_token, expires_in, token_type, refresh_token } = token;
    localStorage.setItem(ACCESS_TOKEN, access_token);
    localStorage.setItem(REFRESH_TOKEN, refresh_token);
    const expiry = new Date().getTime() + (expires_in * 1000);
    localStorage.setItem(EXPIRES_IN, expiry);
    localStorage.setItem(TOKEN_TYPE, token_type);
};

if (code) {
    try {
        const token = await getToken(code);
        if (token) {
            saveTokenToLocalStorage(token);
            const url = new URL(window.location.href);
            url.searchParams.delete("code");
            window.location.href = "/";
        }
    } catch (error) {
        console.error("Unable to fetch token", error);
    }
}

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

async function loginToSpotify() {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const scope = 'user-read-private user-read-email';
    const authUrl = new URL(`${BASE_AUTH_URL}/${END_POINTS.AUTH}`);

    localStorage.setItem('code_verifier', codeVerifier);

    const params = {
        response_type: 'code',
        client_id: CLIENT_ID,
        scope,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: redirectUrl,
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}

document.addEventListener("DOMContentLoaded", () => {
    const loginContainer = document.getElementById("login-container");
    loginContainer.innerHTML = `
        <article class="bg-secondary flex  max-w-sm flex-col gap-4 p-4 rounded-md ">
            <header class="flex gap-2 flex-col items-center justify-center">
                <img src="${spotifyLogo}" class="h-8 w-8">
                <h1 class="text-xl">Login to Spotify</h1>
            </header>
            <button id="login-button" class="rounded-xl bg-spotify-green p-2">Login</button>
        </article>
    `;
    
    const loginButton = document.getElementById("login-button");
    loginButton.addEventListener("click", loginToSpotify);
});