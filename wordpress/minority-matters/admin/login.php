<?php
if (!defined('ABSPATH')) exit;
// /admin/login/: log in to the admin panel with your email (or username) and password

$errors = [
  'wrong' => 'Wrong email or password. Try again.',
  'access' => 'This account can’t manage the website. Ask the administrator to add you as a Website manager.',
  'busy' => 'Too many tries. Please wait 10 minutes and try again.',
];
$code = isset($_GET['problem']) && is_string($_GET['problem']) ? $_GET['problem'] : '';
$theme = get_template_directory_uri();
?><!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Admin login | Minority Matters</title>
  <link rel="icon" href="<?php echo esc_url($theme . '/assets/images/logo.png'); ?>">
  <link rel="stylesheet" href="<?php echo esc_url($theme . '/assets/css/app.css?v=' . @filemtime(get_template_directory() . '/assets/css/app.css')); ?>">
</head>
<body>
<main class="flex min-h-screen items-center justify-center bg-mist px-4">
  <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
    <input type="hidden" name="action" value="mm_login">
    <img src="<?php echo esc_url($theme . '/assets/images/logo.png'); ?>" alt="Minority Matters" class="h-16 w-16">
    <h1 class="mt-6 font-display text-2xl font-bold">Admin login</h1>
    <p class="mt-1 text-sm text-muted">Log in to manage the website.</p>
    <?php if (isset($errors[$code])) : ?>
      <p class="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert"><?php mm_e($errors[$code]); ?></p>
    <?php elseif (!empty($_GET['out'])) : ?>
      <p class="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800" role="status">You are logged out.</p>
    <?php endif; ?>
    <label class="mt-6 block">
      <span class="mb-1.5 block text-sm font-semibold">Email</span>
      <input name="login" required autofocus autocomplete="username" class="field">
    </label>
    <label class="mt-4 block">
      <span class="mb-1.5 block text-sm font-semibold">Password</span>
      <input name="password" type="password" required autocomplete="current-password" class="field">
    </label>
    <label class="mt-4 flex items-center gap-3 text-sm">
      <input type="checkbox" name="remember" value="1" class="h-4 w-4 accent-[#e71d73]"> Keep me logged in
    </label>
    <button type="submit" class="mt-6 rounded-full bg-pink px-6 py-2.5 font-semibold text-white transition-colors hover:bg-pink-dark">Log in</button>
    <p class="mt-6 text-sm"><a href="<?php echo esc_url(wp_lostpassword_url(mm_panel_url())); ?>" class="font-semibold text-pink hover:underline">Forgot your password?</a></p>
  </form>
</main>
</body>
</html>
