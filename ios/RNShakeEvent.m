#import "RNShakeEvent.h"

#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

static NSString *const RCTShowDevMenuNotification = @"RCTShowDevMenuNotification";
static NSString *const RNShakeEventName = @"ShakeEvent";

#if !RCT_DEV

@implementation UIWindow (RNShakeEvent)

- (void)handleShakeEvent:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
    if (event.subtype == UIEventSubtypeMotionShake) {
        [[NSNotificationCenter defaultCenter] postNotificationName:RCTShowDevMenuNotification object:nil];
    }
}

@end

@implementation RNShakeEvent

RCT_EXPORT_MODULE();


+ (void)initialize
{
    RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(handleShakeEvent:withEvent:));
}

- (instancetype)init
{
    if ((self = [super init])) {
        RCTLogInfo(@"RNShakeEvent: Started in debug mode");
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(motionEnded:)
                                                     name:RCTShowDevMenuNotification
                                                   object:nil];
    }
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)motionEnded:(NSNotification *)notification
{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"shakeDetected" object:nil];
}

@end

#else

@implementation RNShakeEvent

- (instancetype)init
{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(motionEnded:)
                                                 name:RCTShowDevMenuNotification
                                               object:nil];
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)motionEnded:(NSNotification *)notification
{
    [[NSNotificationCenter defaultCenter] postNotificationName:@"shakeDetected" object:nil];
}

@end

#endif
