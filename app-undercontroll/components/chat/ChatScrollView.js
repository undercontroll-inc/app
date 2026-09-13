import { forwardRef } from "react";
import { KeyboardChatScrollView } from "react-native-keyboard-controller";

const ChatScrollView = forwardRef(function ChatScrollView(props, ref) {
  return (
    <KeyboardChatScrollView
      ref={ref}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      keyboardDismissMode="interactive"
      keyboardLiftBehavior="whenAtEnd"
      {...props}
      inverted={false}
    />
  );
});

export default ChatScrollView;
