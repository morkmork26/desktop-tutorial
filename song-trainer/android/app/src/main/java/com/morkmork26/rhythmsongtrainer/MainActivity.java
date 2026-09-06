package com.morkmork26.rhythmsongtrainer;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeSongPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
