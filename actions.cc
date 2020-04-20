#include "actions.h"

static bool stats = false;

void enable_statistics() { stats = true; }

G4Run* RunAction::GenerateRun() { return nullptr; }
void RunAction::BeginOfRunAction(const G4Run*) { }
void RunAction::EndOfRunAction(const G4Run*) { }

void EventAction::BeginOfEventAction(const G4Event*) { }
void EventAction::EndOfEventAction(const G4Event*) { }

void TrackingAction::PreUserTrackingAction(const G4Track*) { }
void TrackingAction::PostUserTrackingAction(const G4Track*) { }

void SteppingAction::UserSteppingAction(const G4Step*) { }
