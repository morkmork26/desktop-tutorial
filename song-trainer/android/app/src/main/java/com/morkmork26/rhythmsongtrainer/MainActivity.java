package com.morkmork26.rhythmsongtrainer;

import android.os.Bundle;
import androidx.media3.common.util.UnstableApi;
import com.getcapacitor.BridgeActivity;

@UnstableApi
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeSongPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
