<?php

header('Content-Type: application/json');

// Define your secret key
$secretKey = '0x4AAAAAACj6DClmmYcRESU3OOjCUOrSJc0';

// Get response token from the form
$responseToken = $_POST['cf-turnstile-response'] ?? '';

// Basic guard — reject immediately if no token
if (empty($responseToken)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Captcha token missing.']);
    exit;
}

// Get user's IP address
$remoteIP = $_SERVER['REMOTE_ADDR'];

// Prepare data for the POST request
$data = [
    'secret'   => $secretKey,
    'response' => $responseToken,
    'remoteip' => $remoteIP
];

// Initialize Curl session
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);

// Check if Turnstile verification passed
if (!$result || !isset($result['success']) || $result['success'] !== true) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Captcha verification failed. Please try again.']);
    exit;
}

// --- Turnstile passed — collect & sanitize fields ---
// NOTE: HTML form uses name="Name", name="Email", name="Message" (capitalized)
$name    = htmlspecialchars(trim($_POST['Name']    ?? ''), ENT_QUOTES, 'UTF-8');
$email   = filter_var(trim($_POST['Email']   ?? ''), FILTER_SANITIZE_EMAIL);
$message = htmlspecialchars(trim($_POST['Message'] ?? ''), ENT_QUOTES, 'UTF-8');

if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
    exit;
}

// Send email
$recipient = 'mclabucca@gmail.com';
$subject   = 'New Contact Form Submission from ' . $name;
$body      = "Name: {$name}\nEmail: {$email}\n\nMessage:\n{$message}";
$headers   = "From: no-reply@yourdomain.com\r\nReply-To: {$email}\r\nX-Mailer: PHP/" . phpversion();

if (mail($recipient, $subject, $body, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Message sent successfully!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Email could not be sent. Please try again later.']);
}