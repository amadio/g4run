#ifndef ACTIONS_H
#define ACTIONS_H

#include <G4UserRunAction.hh>
#include <G4UserEventAction.hh>
#include <G4UserTrackingAction.hh>
#include <G4UserSteppingAction.hh>

class G4Run;
class G4Event;
class G4Track;
class G4Step;

void enable_statistics();

class RunAction final : public G4UserRunAction {
public:
	G4Run* GenerateRun() override;
	void BeginOfRunAction(const G4Run*) override;
	void EndOfRunAction(const G4Run*) override;
};

class EventAction final : public G4UserEventAction {
public:
	void BeginOfEventAction(const G4Event*) override;
	void EndOfEventAction(const G4Event*) override;
};

class SteppingAction final : public G4UserSteppingAction {
public:
	void UserSteppingAction(const G4Step*) override;
};

class TrackingAction final : public G4UserTrackingAction {
public:
	void PreUserTrackingAction(const G4Track*) override;
	void PostUserTrackingAction(const G4Track*) override;
};

#endif
