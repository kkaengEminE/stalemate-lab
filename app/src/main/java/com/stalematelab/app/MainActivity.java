package com.stalematelab.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;

/** Offline-only app. HTTPS requests are served from packaged assets; no network permission. */
public class MainActivity extends Activity {
    private WebView webView;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        webView.setBackgroundColor(0xFFF7F6F2);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setMixedContentMode(0);
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"appassets.androidplatform.net".equals(request.getUrl().getHost());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String path = request.getUrl().getPath();
                if (!"https".equals(request.getUrl().getScheme()) || !"appassets.androidplatform.net".equals(request.getUrl().getHost()) || path == null || path.contains("..")) return missing();
                if (path.equals("/")) path = "/index.html";
                String mime = path.endsWith(".html") ? "text/html" : path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
                try { return new WebResourceResponse(mime, "UTF-8", getAssets().open(path.substring(1))); }
                catch (IOException e) { return missing(); }
            }
            private WebResourceResponse missing() {
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
        });
        setContentView(webView);
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        webView.requestApplyInsets();
        if (state == null) webView.loadUrl("https://appassets.androidplatform.net/index.html");
        else webView.restoreState(state);
    }
    @Override protected void onSaveInstanceState(Bundle state) { webView.saveState(state); super.onSaveInstanceState(state); }
    @Override public void onBackPressed() { webView.evaluateJavascript("window.appBack && window.appBack()", result -> { if (!"true".equals(result)) finish(); }); }
    @Override protected void onDestroy() { webView.destroy(); super.onDestroy(); }
}
