
#ifdef RCT_NEW_ARCH_ENABLED
#import "RNDevSpec.h"

@interface Dev : NSObject <NativeDevSpec>
#else
#import <React/RCTBridgeModule.h>

@interface Dev : NSObject <RCTBridgeModule>
#endif

@end
