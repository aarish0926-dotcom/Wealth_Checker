package in.wealthtrack.safe;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebChromeClient;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

public class MainActivity extends Activity {
 private WebView web;
 private static final String HOME="https://wealthtrack-two.vercel.app/login";
 @Override public void onCreate(Bundle savedState) {
  super.onCreate(savedState);
  web=new WebView(this);
  web.getSettings().setJavaScriptEnabled(true);
  web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false);
  web.getSettings().setAllowContentAccess(false);
  web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
  web.setWebChromeClient(new WebChromeClient());
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest req) {
    Uri url=req.getUrl();
    if("https".equals(url.getScheme()) && "wealthtrack-two.vercel.app".equalsIgnoreCase(url.getHost())) return false;
    if("https".equals(url.getScheme())) {startActivity(new Intent(Intent.ACTION_VIEW,url));return true;}
    return true;
   }
   @Override public void onReceivedError(WebView view,int errorCode,String description,String failingUrl) {
    Toast.makeText(MainActivity.this,"Connection issue. Check internet and retry.",Toast.LENGTH_LONG).show();
   }
  });
  setContentView(web);
  if(savedState!=null) web.restoreState(savedState); else web.loadUrl(HOME);
 }
 @Override protected void onSaveInstanceState(Bundle out){web.saveState(out);super.onSaveInstanceState(out);}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
