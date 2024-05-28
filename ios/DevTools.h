#import <React/RCTBridgeModule.h>
#import "RNShakeEvent.h"

@interface DevToolsModule : RCTEventEmitter <RCTBridgeModule>

@property (nonatomic, strong) RNShakeEvent* shake;
@property (nonatomic, assign) BOOL setBridgeOnMainQueue;
@property (nonatomic, strong) dispatch_queue_t logQueue;
@end
