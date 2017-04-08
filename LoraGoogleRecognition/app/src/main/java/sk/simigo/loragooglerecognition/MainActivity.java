package sk.simigo.loragooglerecognition;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import com.squareup.okhttp.Response;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.Menu;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;


import org.json.JSONException;
import org.json.JSONObject;

import at.markushi.ui.CircleButton;
import sk.simigo.loragooglerecognition.utils.ConstantsUtils;

public class MainActivity extends Activity {

    private static final Logger LOG = Logger.getLogger("MainActivity");

    public static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private static final String LORA_URL = ConstantsUtils.DEFAULT_LORA_URL + ":" + ConstantsUtils.DEFAULT_LORA_PORT;
    private final int REQ_CODE_SPEECH_INPUT = 100;

    private OkHttpClient client = new OkHttpClient();

    private TextView txtSpeechInput;
    private CircleButton btnSpeak;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        txtSpeechInput = (TextView) findViewById(R.id.txtSpeechInput);
        btnSpeak = (CircleButton) findViewById(R.id.btnSpeak);

        // hide the action bar
        getActionBar().hide();

        btnSpeak.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                promptSpeechInput();
            }
        });
    }

    /**
     * Showing google speech input dialog
     */
    private void promptSpeechInput() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT,
                getString(R.string.speech_prompt));
        try {
            startActivityForResult(intent, REQ_CODE_SPEECH_INPUT);
        } catch (ActivityNotFoundException a) {
            Toast.makeText(getApplicationContext(),
                    getString(R.string.speech_not_supported),
                    Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Receiving speech input
     */
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        switch (requestCode) {
            case REQ_CODE_SPEECH_INPUT: {
                if (resultCode == RESULT_OK && null != data) {

                    ArrayList<String> result = data
                            .getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);

                    getRidOfLaura(result);
                    txtSpeechInput.setText(result.get(0));

                    new RequestTask().execute(result.get(0));
                }
                break;
            }

        }
    }

    private void getRidOfLaura(ArrayList<String> result) {
        for (String item : result) {
            if (item.toLowerCase().contains("laura")) {

            }
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    class RequestTask extends AsyncTask<String, String, String> {

        String response = null;

        @Override
        protected String doInBackground(String... text) {
            String responseString = null;

            JSONObject jsonObj = new JSONObject();
            try {
                jsonObj.put("text", ((String[]) text)[0]);
            } catch (JSONException e) {
                e.printStackTrace();
            }

            String data = jsonObj.toString();
            try {
                responseString = doPostRequest(LORA_URL + ConstantsUtils.DEFAULT_LORA_API, data);
            } catch (IOException e) {
                e.printStackTrace();
            }

            return responseString;
        }

        @Override
        protected void onPostExecute(String result) {
            super.onPostExecute(result);
            txtSpeechInput.setText(result);
        }
    }

    private String doPostRequest(String url, String json) throws IOException {
        RequestBody body = RequestBody.create(JSON, json);
        Request request = new Request.Builder()
                .url(url)
                .post(body)
                .build();
        Response response = client.newCall(request).execute();
        return response.body().string();
    }


}
