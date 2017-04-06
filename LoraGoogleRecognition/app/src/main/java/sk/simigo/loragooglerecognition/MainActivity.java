package sk.simigo.loragooglerecognition;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Locale;
import java.util.logging.Level;
import java.util.logging.Logger;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.Menu;
import android.view.View;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import javax.net.ssl.HttpsURLConnection;

import at.markushi.ui.CircleButton;
import sk.simigo.loragooglerecognition.utils.ConstantsUtils;

public class MainActivity extends Activity {

    private static final Logger LOG = Logger.getLogger("MainActivity");

    private static final String LORA_URL = ConstantsUtils.DEFAULT_LORA_URL + ":" +ConstantsUtils.DEFAULT_LORA_PORT;
    private final int REQ_CODE_SPEECH_INPUT = 100;

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
	 * */
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
	 * */
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		super.onActivityResult(requestCode, resultCode, data);

		switch (requestCode) {
		case REQ_CODE_SPEECH_INPUT: {
			if (resultCode == RESULT_OK && null != data) {

				ArrayList<String> result = data
						.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
				txtSpeechInput.setText(result.get(0));

                new RequestTask().execute(result.get(0));
            }
			break;
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
			try {
				URL url = new URL(LORA_URL + ConstantsUtils.DEFAULT_LORA_API + "?text=" + ((String[]) text)[0]);
				HttpURLConnection conn = (HttpURLConnection) url.openConnection();

                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type",
                        "application/x-www-form-urlencoded");
                conn.setRequestProperty("Content-Language", "en-US");

                if(conn.getResponseCode() == HttpsURLConnection.HTTP_OK){
					response = conn.getResponseMessage();
				}
				else {
					response = String.valueOf(conn.getResponseCode()); // See documentation for more info on response handling
				}
			} catch (IOException e) {
				LOG.log(Level.INFO, "Error while processing response" + e);
			}
			return responseString;
		}

        @Override
		protected void onPostExecute(String result) {
			super.onPostExecute(result);
               txtSpeechInput.setText(response);
		}
	}

}
