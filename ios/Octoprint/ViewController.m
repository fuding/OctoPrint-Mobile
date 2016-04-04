
#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    //register notifications for open/close
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onForeground:) name:@"onForeground" object: nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onBackground:) name:@"onBackground" object: nil];
    
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *url = [defaults stringForKey:@"serverURL"];
    NSString *apikey = [defaults stringForKey:@"apikey"];
    
    if (![url hasSuffix:@"/"] ) {
        url = [NSString stringWithFormat: @"%@/", url];
    }

    if ( [apikey length] == 0 || [url length] == 0) {
        NSString *htmlString = @"<html><head></head><body><p>Please fully close (double tap home and swipe), then reopen the application after setting the server URL and API KEY</p></body></html>";
        [self.webView loadHTMLString: htmlString baseURL: nil];
        [[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]];
    } else {
        NSString *goto_url = [NSString stringWithFormat: @"%@/?apikey=%@", url, apikey];
        //NSLog(@"URL %@", goto_url);
        [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:goto_url]]];
    }
}

-(void)onForeground:(NSNotification*) notification
{
    NSString* javaScript =  @"onForeground()";
    //NSLog(@"octopi: %@", javaScript);
    [self.webView stringByEvaluatingJavaScriptFromString:javaScript];
}

-(void)onBackground:(NSNotification*) notification
{
    NSString* javaScript = @"onBackground();";
    //NSLog(@"octopi: %@", javaScript);
    [self.webView stringByEvaluatingJavaScriptFromString:javaScript];
}


-(void)viewDidUnload
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"onForeground" object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"onBackground" object:nil];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (BOOL)canBecomeFirstResponder {
    return YES;
}

- (void)motionBegan:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
    if (motion == UIEventSubtypeMotionShake) {
       [self.webView reload];
    }
}

@end
